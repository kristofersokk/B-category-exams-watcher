import fs from 'fs';
import HtmlTableToJson from 'html-table-to-json';
import puppeteer from 'puppeteer-core';
import {
  initializeEmailService,
  sendDebugEmail,
  sendMail,
  sendSetupEmail,
} from './email';
import { getCurrentDate, sleep } from './helpers';
import { TEMPLATE_NEW_ENTRIES } from './stringTemplates';

// Check available times every 5 seconds
const CHECK_DELAY = 5;
const SHOW_BROWSER_WINDOW = false;
const SEND_SETUP_EMAIL = false;

export type Slot = {
  Linn: string;
  Aeg: string;
  'Vahe avastatuga': string;
  Avastatud: string;
  'Oli vaba': string;
  [args: string]: string;
};

export type Filter = {
  cities: string[];
};

type ClientData = {
  filter?: Filter;
};

export type GmailAuth = {
  user: string;
  pass: string;
};

export type Metadata = {
  chromePath: string;
  cacheFile: string;
  serviceGmailAuth: GmailAuth;
  debugEmail?: string;
  clients: {
    [client: string]: ClientData;
  };
};

const metadata: Metadata = JSON.parse(fs.readFileSync('metadata.json', 'utf8'));
const {
  clients,
  cacheFile,
  chromePath,
  debugEmail,
  serviceGmailAuth,
} = metadata;

initializeEmailService({
  debugEmail,
  serviceGmailAuth,
});

console.log(metadata);

let browser: puppeteer.Browser | null = null;
let page: puppeteer.Page | null = null;

let oldSlots: Slot[] = [];
try {
  const oldSlotsStr = fs.readFileSync(cacheFile, 'utf-8');
  if (oldSlotsStr) {
    oldSlots = JSON.parse(oldSlotsStr);
  }
} catch {
  console.log("Can't read cached file");
}

const writeNewAvailableSlotsToFile = (slots: Slot[]) => {
  fs.writeFile(cacheFile, JSON.stringify(slots), (err) => {
    if (err) throw err;
  });
};

const slotsAreEquivalent = (slot1: Slot, slot2: Slot) =>
  slot1.Linn === slot2.Linn && slot1.Aeg === slot2.Aeg;

const diffSlots = (slots: Slot[]) => {
  // console.log(slots.length);

  if (slots.length === 0) {
    console.log("Couldn't get available times from website");
  }

  let result = null;
  if (oldSlots.length > 0) {
    const maxShift = slots.length;
    let shiftFound = null;

    shiftLoop: for (let i = 0; i < maxShift; i++) {
      for (let j = 0; j < maxShift - i; j++) {
        const oldSlot = oldSlots[j];
        const newSlot = slots[j + i];
        if (!slotsAreEquivalent(oldSlot, newSlot)) {
          continue shiftLoop;
        }
      }
      shiftFound = i;
      if (shiftFound) {
        console.log('New entries found: ' + shiftFound);
      }
      break;
    }

    if (shiftFound) {
      result = [];
      for (let k = 0; k < shiftFound; k++) {
        result.push(slots[k]);
      }
    } else {
      // console.log('No new entries');
      return null;
    }
  }

  writeNewAvailableSlotsToFile(slots);
  oldSlots = slots;
  return result;
};

const filterDiff = (slots: Slot[], filter: Filter) => {
  let result: Slot[] | null = [];
  if (filter) {
    slots.forEach((slot) => {
      const cityFits =
        !slot.Linn || !filter.cities || filter.cities.includes(slot.Linn);
      if (cityFits) {
        result?.push(slot);
      }
    });
    if (result.length === 0) {
      result = null;
    }
  } else {
    result = slots;
  }

  return result;
};

const fetchSlots = async (): Promise<Slot[] | null> => {
  // console.log('Fetching eksamiajad');
  try {
    if (page) {
      await page.reload();
      await sleep(2000);

      const tableHead = await page.$eval(
        '.styled-table thead',
        (e) => e.innerHTML
      );
      const tableBody = await page.$eval(
        '.styled-table tbody',
        (e) => e.innerHTML
      );

      const jsonTables = HtmlTableToJson.parse(
        `<table>${tableHead}${tableBody}</table>`
      );
      const results = jsonTables.results[0];
      return results;
    }
  } catch (e) {
    // throw e;
    return null;
  }
  return null;
};

const handleDiffedSlots = (diff: Slot[]) => {
  Object.entries(clients).forEach(([client, clientData]) => {
    const filteredDiff = clientData.filter
      ? filterDiff(diff, clientData.filter)
      : diff;
    if (filteredDiff && filteredDiff.length > 0) {
      const mailText = TEMPLATE_NEW_ENTRIES(filteredDiff);
      sendMail(client, 'Avanes sõidueksamiaeg', mailText);
    }
  });
};

const handleSlots = (slots: Slot[]) => {
  const diff = diffSlots(slots);
  if (diff) {
    console.log(getCurrentDate());
    console.log(diff);
    handleDiffedSlots(diff);
  }
};

// Runs every CHECK_DELAY seconds
const mainWork = async () => {
  const slots = await fetchSlots();
  // console.log(slots);
  if (slots) {
    handleSlots(slots);
  }
};

const printEveryHour = async () => {
  const alwaysRun = true;

  while (alwaysRun) {
    const currentDate = new Date();
    if (currentDate.getMinutes() === 0 && currentDate.getSeconds() === 0) {
      console.log(getCurrentDate());
    }
    await sleep(1000);
  }
};

const mainFunction = async () => {
  console.log('Starting puppeteer');
  browser = await puppeteer.launch({
    headless: !SHOW_BROWSER_WINDOW,
    executablePath: chromePath,
  });
  page = await browser.newPage();
  await page?.goto('https://eksamiajad.ee/');
  const alwaysRun = true;

  if (SEND_SETUP_EMAIL) {
    sendSetupEmail(clients);
  }

  printEveryHour();
  console.log(`Starting monitoring every ${CHECK_DELAY} seconds`);

  while (alwaysRun) {
    try {
      await mainWork();
    } catch (e: unknown) {
      await browser?.close();
      console.log(e);
      sendDebugEmail(`Crashed with:\n${e}`);
    }
    await sleep(CHECK_DELAY * 1000);
  }
};

mainFunction();
