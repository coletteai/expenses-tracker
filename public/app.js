// ═══════════════════════════════
//  STATIC DATA
// ═══════════════════════════════
const FAMILY_MEMBERS = ['Colby', 'Colette', 'Carter', 'Gigi & Nana'];

const STATIC_TABS = [
  { id:'teramo',        label:'Teramo',        color:'#7B1FA2', isProperty: true,  kind:'recurring' },
  { id:'branch',        label:'Branch',        color:'#D84315', isProperty: true,  kind:'recurring' },
  { id:'danzig',        label:'Danzig',        color:'#1565C0', isProperty: true,  kind:'recurring' },
  { id:'marquis',       label:'Marquis',       color:'#37474F', isProperty: true,  kind:'recurring' },
  { id:'subscriptions', label:'Subscriptions', color:'#2E7D32', isProperty: false, kind:'recurring' },
  { id:'personal',      label:'Personal Care', color:'#C2185B', isProperty: false, kind:'non-recurring' },
  { id:'credit',        label:'Credit Cards',  color:'#B71C1C', isProperty: false, kind:'recurring' },
  { id:'family',        label:'Family',        color:'#00838F', isProperty: false, kind:'non-recurring', members: FAMILY_MEMBERS },
];

const DEFAULT_BILLS = {
  teramo: [
    { id:'t1',  name:'Trovare HOA (Powerstone)',         freq:'Monthly',    typical:677,   phone:'949-535-4533', acct:'',  acctName:'', methods:['Online Manual Payment','Auto-Pay'] },
    { id:'t2',  name:'HOA #2 – Newport Coast (1stSvc)',  freq:'Monthly',    typical:155,   phone:'800-428-5588', acct:'',  acctName:'', methods:['ACH Auto Pay','Online Manual Payment'] },
    { id:'t3',  name:'Southern CA Edison (SCE)',          freq:'Monthly',    typical:null,  phone:'',             acct:'',  acctName:'', methods:['DirectPay WF Checking','Online Manual Payment'] },
    { id:'t4',  name:'SoCal Gas',                        freq:'Monthly',    typical:null,  phone:'',             acct:'',  acctName:'', methods:['AutoPay WF Checking','Online Manual Payment'] },
    { id:'t5',  name:'Irvine Ranch Water',               freq:'Monthly',    typical:null,  phone:'949-453-5300', acct:'',  acctName:'', methods:['WF E-Check','AutoPay WF Checking'] },
    { id:'t6',  name:'Waste Management (Trash)',         freq:'Monthly',    typical:null,  phone:'',             acct:'',  acctName:'', methods:['AutoPay','Online Manual Payment'] },
    { id:'t7',  name:'COX Internet',                    freq:'Monthly',    typical:60,    phone:'',             acct:'',  acctName:'', methods:['Amex 1001 AutoPay','Online Manual Payment'] },
    { id:'t8',  name:'ADT Security',                    freq:'Monthly',    typical:36.99, phone:'800-690-3613', acct:'',  acctName:'', methods:['Autopay AX','Online Manual Payment'] },
    { id:'t9',  name:'Housekeeping',                    freq:'Monthly',    typical:null,  phone:'',             acct:'',  acctName:'', methods:['Cash','Zelle','Check'] },
    { id:'t10', name:'Ring Camera',                     freq:'Annual',     typical:99.98, phone:'',             acct:'',  acctName:'', methods:['Amex6006 AutoPay','Amex1001'] },
  ],
  branch: [
    { id:'b1', name:'HOA – Newport Coast',              freq:'Monthly',    typical:240,   phone:'888-354-0135', acct:'',  acctName:'', methods:['ACH Auto Pay','Online Manual Payment'] },
    { id:'b2', name:'Southern CA Edison (SCE)',          freq:'Monthly',    typical:null,  phone:'',             acct:'',  acctName:'', methods:['DirectPay WF Checking','Online Manual Payment'] },
    { id:'b3', name:'SoCal Gas',                        freq:'Monthly',    typical:null,  phone:'877-238-0092', acct:'',  acctName:'', methods:['AutoPay WF Checking','Online Manual Payment'] },
    { id:'b4', name:'Irvine Ranch Water',               freq:'Monthly',    typical:null,  phone:'949-453-5300', acct:'',  acctName:'', methods:['Autopay WF Checking','Online Manual Payment'] },
    { id:'b5', name:'Waste Management (Trash)',         freq:'Quarterly',  typical:74.49, phone:'866-964-2729', acct:'',  acctName:'', methods:['Check','AutoPay'] },
    { id:'b6', name:'Gardener',                         freq:'Monthly',    typical:null,  phone:'',             acct:'',  acctName:'', methods:['Zelle','Cash'] },
    { id:'b7', name:'Housekeeping',                     freq:'Monthly',    typical:null,  phone:'',             acct:'',  acctName:'', methods:['Cash','Zelle','Check'] },
    { id:'b8', name:'Ring Solo Camera',                 freq:'Annual',     typical:99.98, phone:'',             acct:'',  acctName:'', methods:['Amex6006 AutoPay','Amex1001'] },
  ],
  danzig: [
    { id:'d1', name:'City of Alhambra Water',           freq:'Bimonthly',  typical:null,  phone:'',             acct:'',  acctName:'', methods:['WF Checking','Online Manual Payment'] },
    { id:'d2', name:'Watering',                         freq:'Monthly',    typical:150,   phone:'',             acct:'',  acctName:'', methods:['Zelle - Lara'] },
    { id:'d3', name:'Pool',                             freq:'Monthly',    typical:180,   phone:'',             acct:'',  acctName:'', methods:['Zelle Nicholas Garcia','Zelle'] },
  ],
  marquis: [
    { id:'m1', name:'ATT Internet & Cable',             freq:'Monthly',    typical:175,   phone:'',             acct:'',  acctName:'', methods:['AX Preferred','Amex1001','Online Manual Payment'] },
    { id:'m2', name:'ADT Security',                     freq:'Monthly',    typical:40.79, phone:'800-690-3613', acct:'',  acctName:'', methods:['Amex1001','AX Preferred'] },
    { id:'m3', name:'Ring Solo',                        freq:'Annual',     typical:null,  phone:'',             acct:'',  acctName:'', methods:['AutoPay','Online Manual Payment'] },
  ],
  subscriptions: [
    { id:'s1',  name:'ATT Mobile',                     freq:'Monthly',    typical:207,   phone:'800-331-0500', acct:'',  acctName:'Kai Wang', methods:['AutoPay WF Checking'] },
    { id:'s2',  name:'New Life Ministries',             freq:'Monthly',    typical:100,   phone:'',             acct:'',  acctName:'Kai Wang', methods:['AX 1001'] },
    { id:'s3',  name:'iCloud (6 lines, 2 TB)',          freq:'Monthly',    typical:9.99,  phone:'',             acct:'',  acctName:'Apple Store', methods:['PayPal AX 1001'] },
    { id:'s4',  name:'Wall Street Journal ⚠️ Cancel 5/18/27', freq:'Monthly', typical:7.99, phone:'', acct:'', acctName:'', methods:['PayPal AX 1001'] },
    { id:'s5',  name:'Amex Preferred – Annual Fee',    freq:'Annual',     typical:95,    phone:'',             acct:'',  acctName:'', methods:['AutoPay','Online Manual Payment'] },
    { id:'s6',  name:'Meitu Photo',                    freq:'Annual',     typical:49.99, phone:'',             acct:'',  acctName:'', methods:['AX 1001'] },
    { id:'s7',  name:'Amazon Prime',                   freq:'Annual',     typical:139,   phone:'',             acct:'',  acctName:'', methods:['AutoPay','Online Manual Payment'] },
    { id:'s8',  name:'OneRep',                         freq:'Annual',     typical:99.95, phone:'',             acct:'',  acctName:'', methods:['AX Preferred','AX 1001'] },
    { id:'s9',  name:'WF Lockbox',                     freq:'Annual',     typical:null,  phone:'',             acct:'',  acctName:'', methods:['WF Checking'] },
    { id:'s10', name:'AAA – Ko',                       freq:'Annual',     typical:null,  phone:'',             acct:'',  acctName:'', methods:['Check','Online Payment'] },
    { id:'s11', name:'DMV – Porsche',                  freq:'Annual',     typical:null,  phone:'',             acct:'',  acctName:'Kai Wang', methods:['Online Payment','Check'] },
    { id:'s12', name:'DMV – Infiniti',                 freq:'Annual',     typical:null,  phone:'',             acct:'',  acctName:'', methods:['Online Payment','Check'] },
    { id:'s13', name:'DMV – Lexus',                    freq:'Annual',     typical:null,  phone:'',             acct:'',  acctName:'', methods:['AAA Office','Online Payment'] },
    { id:'s14', name:'DMV – FJ',                       freq:'Annual',     typical:null,  phone:'',             acct:'',  acctName:'', methods:["Colby's Checking","Online Payment"] },
  ],
  personal: [],
  credit: [
    { id:'c1', name:'Amex Blue Cash Everyday',          freq:'Monthly',    typical:null,  phone:'888-258-3741', acct:'',  acctName:'', methods:['Online Payment','AutoPay','Check'] },
    { id:'c2', name:'Amex Preferred',                   freq:'Monthly',    typical:null,  phone:'',             acct:'',  acctName:'', methods:['Online Payment','AutoPay','Check'] },
  ],
};

const SEED_PAYMENTS = {
  t1:[{date:'2026-06-04',stmt:'',amount:640,method:'Online Manual Payment',notes:''},{date:'2026-05-12',stmt:'',amount:678,method:'',notes:'$3.50 Processing Fee'},{date:'2026-04-13',stmt:'',amount:678,method:'',notes:''},{date:'2026-03-11',stmt:'',amount:678,method:'',notes:''},{date:'2026-01-27',stmt:'',amount:2600,method:'Online Manual Payment',notes:'Special Assessment'},{date:'2026-01-12',stmt:'',amount:678,method:'Auto-Pay',notes:''}],
  t2:[{date:'2026-06-03',stmt:'',amount:155,method:'ACH Auto Pay',notes:''},{date:'2026-05-04',stmt:'',amount:155,method:'',notes:''},{date:'2026-04-02',stmt:'',amount:155,method:'',notes:''},{date:'2026-03-03',stmt:'',amount:155,method:'',notes:''},{date:'2026-02-03',stmt:'',amount:155,method:'',notes:''},{date:'2026-01-05',stmt:'',amount:155,method:'',notes:''}],
  t3:[{date:'2026-06-29',stmt:'',amount:76.19,method:'DirectPay WF Checking',notes:''},{date:'2026-05-20',stmt:'',amount:62.57,method:'',notes:''},{date:'2026-04-21',stmt:'',amount:74.17,method:'',notes:''},{date:'2026-03-23',stmt:'',amount:86.88,method:'',notes:''},{date:'2026-02-19',stmt:'',amount:77.40,method:'',notes:''},{date:'2026-01-20',stmt:'',amount:92.50,method:'',notes:''},{date:'2025-12-17',stmt:'',amount:64.78,method:'',notes:''},{date:'2025-11-17',stmt:'',amount:54.14,method:'',notes:''}],
  t4:[{date:'2026-05-14',stmt:'',amount:8.09,method:'',notes:'Credit'},{date:'2026-03-31',stmt:'',amount:15.34,method:'',notes:''},{date:'2026-03-03',stmt:'',amount:17.19,method:'',notes:''},{date:'2026-02-02',stmt:'',amount:17.85,method:'',notes:''},{date:'2026-01-05',stmt:'',amount:15.89,method:'AutoPay WF Checking',notes:''}],
  t5:[{date:'2026-06-24',stmt:'',amount:27.16,method:'WF E-Check',notes:''}],
  t7:[{date:'2026-05-31',stmt:'',amount:60,method:'Amex 1001 AutoPay',notes:''},{date:'2026-05-01',stmt:'',amount:60,method:'',notes:''},{date:'2026-03-31',stmt:'',amount:60,method:'',notes:''},{date:'2026-03-03',stmt:'',amount:60,method:'',notes:''},{date:'2026-01-31',stmt:'',amount:60,method:'',notes:''}],
  t8:[{date:'2026-05-17',stmt:'',amount:36.99,method:'Autopay AX',notes:''},{date:'2026-04-17',stmt:'',amount:36.99,method:'',notes:''},{date:'2026-03-17',stmt:'',amount:36.99,method:'',notes:''},{date:'2026-02-17',stmt:'',amount:36.99,method:'',notes:''},{date:'2026-01-17',stmt:'',amount:36.99,method:'',notes:''}],
  t10:[{date:'2026-04-14',stmt:'',amount:59.60,method:'Amex1001',notes:'Upgraded Plan'},{date:'2026-01-22',stmt:'',amount:99.98,method:'Amex6006 AutoPay',notes:'Combined Teramo & Branch'}],
  b1:[{date:'2026-06-07',stmt:'',amount:240,method:'',notes:''}],
  b2:[{date:'2026-07-15',stmt:'',amount:130.83,method:'',notes:'Stmt 6/25/26'},{date:'2026-06-09',stmt:'',amount:115.20,method:'',notes:''},{date:'2026-05-11',stmt:'',amount:115.28,method:'',notes:''},{date:'2026-04-08',stmt:'',amount:120.85,method:'',notes:''},{date:'2026-03-10',stmt:'',amount:115.66,method:'',notes:''},{date:'2026-02-10',stmt:'',amount:128.00,method:'',notes:''},{date:'2026-01-07',stmt:'',amount:111.17,method:'',notes:''}],
  b3:[{date:'2026-05-14',stmt:'',amount:16.02,method:'',notes:'Credit'},{date:'2026-04-03',stmt:'',amount:12.12,method:'',notes:''},{date:'2026-03-05',stmt:'',amount:10.10,method:'',notes:''},{date:'2026-02-03',stmt:'',amount:16.02,method:'',notes:''},{date:'2026-01-06',stmt:'',amount:12.13,method:'AutoPay WF Checking',notes:''}],
  b4:[{date:'2026-07-15',stmt:'',amount:108.12,method:'',notes:'Stmt 6/24/26'},{date:'2026-06-16',stmt:'',amount:93.49,method:'',notes:''},{date:'2026-05-14',stmt:'',amount:91.29,method:'',notes:''},{date:'2026-04-15',stmt:'',amount:87.53,method:'',notes:''},{date:'2026-03-16',stmt:'',amount:76.40,method:'',notes:''},{date:'2026-02-13',stmt:'',amount:76.53,method:'',notes:''},{date:'2026-01-13',stmt:'',amount:78.73,method:'Autopay WF Checking',notes:''}],
  b5:[{date:'2026-07-31',stmt:'',amount:89.61,method:'',notes:''},{date:'2026-04-22',stmt:'',amount:74.49,method:'',notes:''},{date:'2026-01-22',stmt:'',amount:74.49,method:'',notes:''},{date:'2025-10-22',stmt:'',amount:74.49,method:'',notes:''},{date:'2025-07-22',stmt:'',amount:74.49,method:'',notes:''}],
  b6:[{date:'2026-06-30',stmt:'',amount:200,method:'Cash',notes:'Francisco – Zelle MAJESF CARE'},{date:'2026-06-01',stmt:'',amount:160,method:'Zelle',notes:'Eusebio Eugenio'}],
  b8:[{date:'2026-01-22',stmt:'',amount:99.98,method:'Amex6006 AutoPay',notes:'Combined Branch & Teramo'}],
  d1:[{date:'2026-05-28',stmt:'',amount:297.92,method:'WF Checking',notes:''},{date:'2026-03-30',stmt:'',amount:246.48,method:'',notes:''},{date:'2026-01-28',stmt:'',amount:199.07,method:'',notes:''},{date:'2025-12-01',stmt:'',amount:146.48,method:'',notes:''}],
  d2:[{date:'2026-06-28',stmt:'',amount:150,method:'Zelle - Lara',notes:''},{date:'2026-05-15',stmt:'',amount:150,method:'',notes:''},{date:'2026-04-15',stmt:'',amount:150,method:'',notes:''},{date:'2026-03-16',stmt:'',amount:150,method:'',notes:''},{date:'2026-01-27',stmt:'',amount:150,method:'',notes:''}],
  d3:[{date:'2026-06-09',stmt:'',amount:180,method:'Zelle Nicholas Garcia',notes:''},{date:'2026-05-05',stmt:'',amount:180,method:'',notes:''},{date:'2026-04-03',stmt:'',amount:180,method:'',notes:''},{date:'2026-03-06',stmt:'',amount:175,method:'',notes:''},{date:'2026-01-27',stmt:'',amount:240,method:'',notes:''}],
  m1:[{date:'2026-05-20',stmt:'',amount:174.99,method:'Amex1001',notes:''},{date:'2026-04-22',stmt:'',amount:174.46,method:'',notes:''},{date:'2026-03-22',stmt:'',amount:179.99,method:'AX Preferred',notes:''},{date:'2026-02-22',stmt:'',amount:179.99,method:'',notes:''},{date:'2026-01-21',stmt:'',amount:174.99,method:'',notes:''}],
  m2:[{date:'2026-06-03',stmt:'',amount:28.55,method:'Amex1001',notes:''},{date:'2026-05-13',stmt:'',amount:586.16,method:'Amex1001',notes:'$40.79/mth for 24 mths'},{date:'2026-05-01',stmt:'',amount:28.55,method:'AX Preferred',notes:''},{date:'2026-04-28',stmt:'',amount:274.59,method:'Amex1001',notes:'Upgraded to new keypad'},{date:'2026-04-01',stmt:'',amount:23.60,method:'',notes:''},{date:'2026-01-01',stmt:'',amount:23.60,method:'AX Preferred',notes:''}],
  s1:[{date:'2026-05-20',stmt:'',amount:145.88,method:'AutoPay WF Checking',notes:''},{date:'2026-04-21',stmt:'',amount:145.92,method:'',notes:''},{date:'2026-03-20',stmt:'',amount:207.78,method:'',notes:'Tampa Comedy Cruise'},{date:'2026-02-20',stmt:'',amount:145.96,method:'',notes:''},{date:'2026-01-20',stmt:'',amount:188.28,method:'',notes:''}],
  s2:[{date:'2026-06-10',stmt:'',amount:100,method:'AX 1001',notes:''},{date:'2026-05-10',stmt:'',amount:100,method:'',notes:''},{date:'2026-04-10',stmt:'',amount:100,method:'',notes:''},{date:'2026-03-10',stmt:'',amount:100,method:'',notes:''},{date:'2026-02-10',stmt:'',amount:100,method:'',notes:''},{date:'2026-01-10',stmt:'',amount:100,method:'AX 1001',notes:''}],
  s3:[{date:'2026-05-16',stmt:'',amount:9.99,method:'PayPal AX 1001',notes:'6 lines, 2 TB'}],
  s4:[{date:'2026-05-21',stmt:'',amount:7.99,method:'PayPal AX 1001',notes:'Goes to $44.99 from 5/18/27'}],
  s5:[{date:'2026-02-22',stmt:'',amount:-50,method:'',notes:'$50 Credit'},{date:'2026-01-29',stmt:'',amount:95,method:'',notes:''}],
  s6:[{date:'2026-03-20',stmt:'',amount:49.99,method:'AX 1001',notes:''},{date:'2025-03-20',stmt:'',amount:50,method:'AX 1001',notes:''}],
  s7:[{date:'2026-10-25',stmt:'',amount:139,method:'',notes:''}],
  s8:[{date:'2025-12-21',stmt:'',amount:99.95,method:'AX Preferred',notes:'Change to AX1001'}],
  c1:[{date:'2026-06-01',stmt:'',amount:2981.45,method:'',notes:'Stmt 05/29'},{date:'2026-05-04',stmt:'',amount:6251.24,method:'',notes:'Stmt 03/30–04/28'},{date:'2026-04-01',stmt:'',amount:11000,method:'',notes:"Nana's Necklace"},{date:'2026-03-01',stmt:'',amount:9219.06,method:'',notes:'Stmt 02/05–03/29'},{date:'2026-02-01',stmt:'',amount:4577.23,method:'',notes:'New Account 1001'},{date:'2026-01-01',stmt:'',amount:3924.61,method:'',notes:''}],
  c2:[{date:'2025-12-01',stmt:'',amount:2401.29,method:'',notes:''},{date:'2025-11-10',stmt:'',amount:4698.33,method:'',notes:''},{date:'2025-10-01',stmt:'',amount:8224.60,method:'',notes:''},{date:'2025-09-16',stmt:'',amount:12175.75,method:'',notes:''},{date:'2025-09-05',stmt:'',amount:10006.67,method:'',notes:''},{date:'2025-08-01',stmt:'',amount:7440.79,method:'',notes:''}],
};

const SEED_OTHER = [
  {tab:'personal',date:'2026-05-30',type:'Lashes',provider:'Brenda',amount:70,notes:''},
  {tab:'personal',date:'2026-05-22',type:'Color Correction',provider:'Tan',amount:350,notes:'Tip $70'},
  {tab:'personal',date:'2026-05-30',type:'Mani Pedi',provider:'Amanda/Cindy',amount:0,notes:'Tip $40'},
  {tab:'teramo',date:'2026-06-12',type:'Living Room Pergola',provider:'Andy Han',amount:4000,notes:''},
  {tab:'teramo',date:'2026-03-14',type:'Bedroom Pergola',provider:'Andy Han',amount:4000,notes:''},
  {tab:'danzig',date:'2025-08-28',type:'A/C Repair',provider:'Rob Chang',amount:275,notes:'Zelle'},
  {tab:'marquis',date:'2026-05-13',type:'Screen Door',provider:'Freddy',amount:600,notes:''},
  {tab:'marquis',date:'2026-05-13',type:'Kitchen Blinds',provider:'Alex (Son)',amount:1190.76,notes:''},
];

// ═══════════════════════════════
//  STATE
// ═══════════════════════════════
let activeTab = 'teramo';
let tabMemberFilter = null;  // e.g. selected family member, filters the current non-recurring tab's log
let viewMonth = new Date(); viewMonth.setDate(1);
let showAllHistory = {};
let editModeBill = null;  // which bill has its "Edit Bill" panel open
let addingPaymentBill = null;  // which bill has an inline "add payment" row open
let editingPaymentId = null;  // which existing payment row is expanded into its editable form
let editingMethods = null;  // array of in-progress payment method strings for the open "Edit Bill" panel
let editingFields = null;  // array of in-progress {id,label,value} bill info fields for the bill in edit mode
let editingOtherExpenses = false;  // whether the "Other Expenses" section edit/delete controls are shown
let confirmDeleteBillId = null;  // bill pending inline delete confirmation
let editingOtherLog = false;  // whether the non-recurring tab's log is in edit mode (mirrors editModeBill)
let addingOtherRow = false;  // whether the non-recurring log's inline "add entry" row is open
let editingOtherRowId = null;  // which existing log entry is expanded into its editable form
let data = {};

// ═══════════════════════════════
//  HELPERS: get effective data
// ═══════════════════════════════
const OTHER_LOG_COLUMNS = [
  { key:'type',     label:'Type of Service' },
  { key:'provider', label:'Provider' },
  { key:'tip',      label:'Tip' },
  { key:'notes',    label:'Notes' },
];

function allTabs() {
  const deleted = new Set(data.deletedTabs||[]);
  const overrides = data.tabOverrides||{};
  const tabs = [...STATIC_TABS, ...(data.customTabs||[])]
    .filter(t => !deleted.has(t.id))
    .map(t => ({ ...t, ...(overrides[t.id]||{}) }));

  const order = data.tabOrder;
  if (!order || !order.length) return tabs;
  const byId = new Map(tabs.map(t=>[t.id,t]));
  const ordered = order.map(id=>byId.get(id)).filter(Boolean);
  tabs.forEach(t => { if (!order.includes(t.id)) ordered.push(t); });
  return ordered;
}

// Which optional log columns a non-recurring tab shows (Date and Amount are always shown).
function tabColumns(tab) {
  return tab.columns || ['type','provider','tip','notes'];
}

function allBills(tabId) {
  const defaults = DEFAULT_BILLS[tabId] || [];
  const custom = (data.customBills||{})[tabId] || [];
  const deleted = new Set(data.deletedBills||[]);
  const all = [...defaults, ...custom].filter(b => !deleted.has(b.id));
  // Apply overrides
  return all.map(b => {
    const ov = (data.billOverrides||{})[b.id] || {};
    return {...b, ...ov};
  });
}

function getBill(billId) {
  for (const tab of allTabs()) {
    const found = allBills(tab.id).find(b => b.id === billId);
    if (found) return found;
  }
  return null;
}

function getTabForBill(billId) {
  for (const tab of allTabs()) {
    if (allBills(tab.id).find(b => b.id === billId)) return tab;
  }
  return null;
}

// Bill info fields (Account #, Telephone, Access #, etc.) are a free-form per-bill list.
// Once customized via the editor, the list lives in billOverrides[id].fields; until then
// it's derived from the bill's legacy acct/acctName/phone/accessNum properties, omitting blanks.
function getBillFields(bill) {
  if (bill.fields) return bill.fields;
  const fields = [];
  if (bill.acct)      fields.push({ id:'acct',      label:'Account #',       value:bill.acct });
  if (bill.acctName)  fields.push({ id:'acctName',  label:'Name on Account', value:bill.acctName });
  if (bill.phone)     fields.push({ id:'phone',     label:'Telephone',       value:bill.phone });
  if (bill.accessNum) fields.push({ id:'accessNum', label:'Access #',        value:bill.accessNum });
  return fields;
}

// ═══════════════════════════════
//  PERSISTENCE
// ═══════════════════════════════
function loadData() {
  data = CloudStore.loadCached();
  if (!data) {
    data = { payments:{}, otherExpenses:[], billOverrides:{}, customBills:{}, customTabs:[], settings:{} };
    Object.entries(SEED_PAYMENTS).forEach(([id, list]) => {
      data.payments[id] = list.map((p,i) => ({...p, id: id+'_'+i}));
    });
    data.otherExpenses = SEED_OTHER.map((e,i) => ({...e, id:'o'+i}));
    // Not saved here on purpose: CloudStore.start() uploads it only if the cloud is empty.
  }
}
function saveData() { CloudStore.save(data); }

// The cloud copy replaced the local one (newer copy on another device, a conflict, or a restore).
function replaceData(fresh, reason) {
  data = fresh;
  if (!allTabs().some(t => t.id === activeTab)) activeTab = allTabs()[0].id;
  renderTabs(); renderContent();
  if (reason === 'conflict') showToast('Another device changed the data. Your last change was not saved. Please redo it.');
  else if (reason === 'refresh') showToast('Updated from your other device');
}

const CLOUD_BANNER_TEXT = {
  unsaved: 'Not saved to cloud yet. Will retry.',
  offline: "Can't reach the cloud. Showing your last saved copy.",
  disconnected: 'Signed out. Reload to sign in again.',
};
function updateCloudBanner(status) {
  const banner = document.getElementById('cloudBanner');
  banner.className = 'cloud-banner' + (status === 'saved' ? '' : ' ' + status);
  document.getElementById('cloudBannerText').textContent = CLOUD_BANNER_TEXT[status] || '';
  document.getElementById('cloudBannerReload').style.display = status === 'disconnected' ? '' : 'none';
}

// ═══════════════════════════════
//  RENDER
// ═══════════════════════════════
async function init() {
  loadData(); renderTabs(); renderContent();
  CloudStore.onReplace(replaceData);
  CloudStore.onStatus(updateCloudBanner);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') CloudStore.refresh(); else CloudStore.flush();
  });
  window.addEventListener('online', () => CloudStore.refresh());
  window.addEventListener('focus', () => CloudStore.refresh());
  window.addEventListener('pagehide', () => CloudStore.flush());
  await CloudStore.start(data);
}

function renderTabs() {
  const tabs = allTabs();
  document.getElementById('tabBar').innerHTML =
    tabs.map(t => {
      const onclick = (t.members && t.members.length)
        ? `handleMemberTabTap(event,this,'${t.id}')`
        : `switchTab('${t.id}')`;
      return `<button class="tab-btn${t.id===activeTab?' active':''}" style="--c:${t.color}" onclick="${onclick}">${t.label}</button>`;
    }).join('');
}

// Tapping a tab with member sub-options (e.g. Family) navigates AND opens its
// menu, so the same one-tap interaction works on touch devices with no hover.
function handleMemberTabTap(event, btnEl, tabId) {
  event.stopPropagation();
  switchTab(tabId);
  // switchTab rebuilds the tab bar's HTML, so btnEl is now detached — re-query the fresh button.
  const freshBtn = document.querySelector('.tab-btn.active') || btnEl;
  showTabMenu(freshBtn, tabId);
}

function showTabMenu(btnEl, tabId) {
  const tab = allTabs().find(t=>t.id===tabId);
  if (!tab || !tab.members) return;
  const menu = document.getElementById('tabHoverMenu');
  const rect = btnEl.getBoundingClientRect();
  menu.style.left = rect.left + 'px';
  menu.style.top = rect.bottom + 'px';
  menu.innerHTML = tab.members.map(m => `<button class="tab-dropdown-item${tabMemberFilter===m ? ' active' : ''}" onclick="selectTabMember('${tabId}','${m}')">${m}</button>`).join('');
  menu.style.display = 'block';
}

function selectTabMember(tabId, member) {
  document.getElementById('tabHoverMenu').style.display = 'none';
  switchTab(tabId);
  tabMemberFilter = member;
  renderContent();
}

// Tapping anywhere outside the open menu closes it.
document.addEventListener('click', function(e) {
  const menu = document.getElementById('tabHoverMenu');
  if (menu && menu.style.display === 'block' && !menu.contains(e.target)) {
    menu.style.display = 'none';
  }
});

function switchTab(id) {
  activeTab=id; showAllHistory={}; editModeBill=null; editingFields=null; editingMethods=null; editingOtherExpenses=false; confirmDeleteBillId=null; tabMemberFilter=null; editingOtherLog=false; addingOtherRow=false; editingOtherRowId=null;
  document.getElementById('tabHoverMenu').style.display = 'none';
  renderTabs(); renderContent();
}

function toggleOtherEditMode() { editingOtherExpenses = !editingOtherExpenses; renderContent(); }

function renderContent() {
  const tab = allTabs().find(t=>t.id===activeTab);
  const isRecurring = tab.kind !== 'non-recurring';
  const ym = viewMonth.toISOString().slice(0,7);

  let html = `<div class="month-nav">
    <div class="month-nav-label">${viewMonth.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</div>
  </div>`;

  // Non-recurring tabs (e.g. Personal Care) — a simple service log, no bills
  if (!isRecurring) {
    let services = (data.otherExpenses||[]).filter(e=>e.tab===activeTab);
    if (tabMemberFilter) services = services.filter(e=>e.provider===tabMemberFilter);
    services = services.sort((a,b)=>b.date.localeCompare(a.date));
    const monthTotal = services.filter(e=>e.date.startsWith(ym)).reduce((s,e)=>(+e.amount||0)+(+e.tip||0)+s, 0);
    const filterSuffix = tabMemberFilter ? ` — ${tabMemberFilter} <button class="clear-filter-btn" onclick="selectTabMember('${activeTab}', null)">✕</button>` : '';
    const cols = tabColumns(tab);
    html += `<div class="section-label">${tab.label} Log${filterSuffix}</div>`;
    html += `<div style="background:#fff;border-radius:16px;box-shadow:0 1px 4px rgba(0,0,0,0.08);overflow:hidden;margin-bottom:14px">`;
    let headerCells = `<div class="payment-cell payments-header-cell col-stmt">Date</div>`;
    if (cols.includes('type'))     headerCells += `<div class="payment-cell payments-header-cell" style="flex:1.2">Type of Service</div>`;
    if (cols.includes('provider')) headerCells += `<div class="payment-cell payments-header-cell" style="flex:1">Provider</div>`;
    headerCells += `<div class="payment-cell payments-header-cell col-amt">Amount</div>`;
    if (cols.includes('tip'))      headerCells += `<div class="payment-cell payments-header-cell col-amt">Tip</div>`;
    if (cols.includes('notes'))    headerCells += `<div class="payment-cell payments-header-cell col-notes">Notes</div>`;
    html += `<div class="payments-header">${headerCells}
      <div class="col-actions">
        <button class="edit-payments-btn${editingOtherLog?' active':''}" onclick="toggleOtherLogEdit()">${editingOtherLog?'Done':'Edit'}</button>
      </div>
    </div>`;
    if (editingOtherLog) html += buildLogColumnsPanel(tab);
    if (addingOtherRow) html += buildInlineOtherRow(tab);
    if (services.length > 0) {
      services.forEach(e => {
        if (editingOtherLog && editingOtherRowId === e.id) {
          html += buildEditOtherRow(tab, e);
        } else {
          let rowCells = `<div class="payment-cell col-stmt">${fmtDate(e.date)}</div>`;
          if (cols.includes('type'))     rowCells += `<div class="payment-cell" style="flex:1.2">${e.type||'—'}</div>`;
          if (cols.includes('provider')) rowCells += `<div class="payment-cell muted" style="flex:1">${e.provider||'—'}</div>`;
          rowCells += `<div class="payment-cell amount col-amt">${e.amount>0?'$'+(+e.amount).toFixed(2):'—'}</div>`;
          if (cols.includes('tip'))      rowCells += `<div class="payment-cell muted col-amt">${(+e.tip||0)>0?'$'+(+e.tip).toFixed(2):'—'}</div>`;
          if (cols.includes('notes'))    rowCells += `<div class="payment-cell muted col-notes">${e.notes||'—'}</div>`;
          html += `<div class="payment-row">${rowCells}
            <div class="col-actions">${editingOtherLog ? `
              <button class="payment-edit-btn-text" onclick="editOtherRow('${e.id}')">Edit</button>
              <button class="payment-delete-btn-text" onclick="deleteOther('${e.id}')">Delete</button>
            ` : ''}</div>
          </div>`;
        }
      });
    } else if (!addingOtherRow) {
      html += `<div class="no-payments">No services logged yet.</div>`;
    }
    html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid #f0f0f5">
      <span style="font-size:13px;color:#8e8e93">This month total: <strong style="color:#1c1c1e">$${monthTotal.toFixed(2)}</strong></span>
      <button class="log-pay-btn" style="background:${tab.color}" onclick="openAddOtherRow()">+ Log Service</button>
    </div></div>`;
    document.getElementById('content').innerHTML = html;
    return;
  }

  // Recurring tabs — Bills flow
  const bills = allBills(activeTab);
  const paidCount = bills.filter(b => (data.payments[b.id]||[]).some(p=>p.date.startsWith(ym))).length;
  const pct = bills.length ? Math.round(paidCount/bills.length*100) : 0;

  html += `<div class="top-actions">
    <button class="small-action-btn" style="background:${tab.color}" onclick="openAddBill()">＋ Add Bill</button>
  </div>`;

  if (bills.length > 0) {
    html += `<div class="progress-wrap">
      <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${pct}%;background:${tab.color}"></div></div>
      <div class="progress-label">${paidCount} of ${bills.length} bills logged this month</div>
    </div>
    <div class="section-label">Bills</div>`;
    bills.forEach(b => { html += buildBillCard(b, tab.color, ym); });
  }

  // Other expenses — only on property tabs
  if (tab.isProperty) {
    const others = (data.otherExpenses||[]).filter(e=>e.tab===activeTab).sort((a,b)=>b.date.localeCompare(a.date));
    html += `<div class="section-label-row">
      <div class="section-label">Other Expenses</div>
      <div class="bill-header-actions">
        <button class="bill-quick-add-btn" onclick="openAddOther()" title="Add Expense">＋</button>
        <button class="edit-payments-btn${editingOtherExpenses?' active':''}" onclick="toggleOtherEditMode()">${editingOtherExpenses?'Done':'Edit'}</button>
      </div>
    </div>
    <div class="other-expenses-card">`;
    others.forEach(e => {
      const amt = e.amount>0 ? `$${(+e.amount).toFixed(2)}` : '—';
      html += `<div class="other-row">
        <div class="other-info">
          <div class="other-type">${e.type}</div>
          <div class="other-sub">${[e.provider,e.notes].filter(Boolean).join(' · ')}</div>
        </div>
        <div class="other-right">
          <div class="other-amount">${amt}</div>
          <div class="other-date">${fmtDate(e.date)}</div>
        </div>
        ${editingOtherExpenses ? `
          <button class="payment-edit-btn" onclick="openEditOther('${e.id}')" title="Edit">✏️</button>
          <button class="other-del" onclick="deleteOther('${e.id}')">✕</button>
        ` : ''}
      </div>`;
    });
    if (others.length === 0) html += `<div class="no-payments">No other expenses yet.</div>`;
    html += `</div>`;
  }

  document.getElementById('content').innerHTML = html;
}

function buildBillCard(bill, color, ym) {
  const payments = (data.payments[bill.id]||[]).sort((a,b)=>b.date.localeCompare(a.date));
  const monthPayments = payments.filter(p=>p.date.startsWith(ym));
  const hasPaid = monthPayments.length > 0;
  const inEditMode = editModeBill === bill.id;

  // Freq badge
  const freqLower = (bill.freq||'').toLowerCase();
  const dueDatesLabel = formatDueDates(bill.dueDates);
  let badgeClass = 'badge-other', badgeLabel = bill.freq || '';
  if (freqLower === 'monthly')    { badgeClass = 'badge-monthly'; badgeLabel = 'Monthly'; }
  else if (freqLower === 'annual'){ badgeClass = 'badge-annual';  badgeLabel = dueDatesLabel ? `Annual (${dueDatesLabel})` : 'Annual'; }
  else if (freqLower === 'semi-annual'){ badgeClass = 'badge-annual'; badgeLabel = dueDatesLabel ? `Semi-Annual (${dueDatesLabel})` : 'Semi-Annual'; }
  else if (freqLower === 'quarterly'){ badgeClass = 'badge-other'; badgeLabel = 'Quarterly'; }
  else if (freqLower === 'bimonthly'){ badgeClass = 'badge-other'; badgeLabel = 'Every 2 Months'; }

  // Bill info — a free-form, per-bill list of named fields (Account #, Telephone, Access #, etc.)
  // Always read-only here; editing happens in the single "Edit Bill" panel below.
  const infoHtml = buildReadOnlyFieldsHtml(bill);

  // Payments
  const showAll = showAllHistory[bill.id];
  const displayed = showAll ? payments : payments.slice(0, 6);
  const hasMore = payments.length > 6;
  const isAdding = addingPaymentBill === bill.id;

  let paymentsHtml = `<div class="payments-header">
    <div class="payment-cell payments-header-cell col-stmt">Stmt Date</div>
    <div class="payment-cell payments-header-cell col-pay">Pay Date</div>
    <div class="payment-cell payments-header-cell col-amt">Amount</div>
    <div class="payment-cell payments-header-cell col-method">Method</div>
    <div class="payment-cell payments-header-cell col-notes">Notes</div>
    <div class="col-actions"></div>
  </div>`;
  if (isAdding) paymentsHtml += buildInlinePaymentRow(bill);
  if (displayed.length > 0) {
    displayed.forEach(p => {
      if (inEditMode && editingPaymentId === p.id) {
        paymentsHtml += buildEditPaymentRow(bill, p);
      } else {
        paymentsHtml += `<div class="payment-row">
          <div class="payment-cell muted col-stmt">${p.stmt ? fmtDate(p.stmt) : '—'}</div>
          <div class="payment-cell col-pay">${fmtDate(p.date)}</div>
          <div class="payment-cell amount col-amt">$${(+p.amount).toFixed(2)}</div>
          <div class="payment-cell muted col-method">${p.method||'—'}</div>
          <div class="payment-cell muted col-notes">${p.notes||''}</div>
          <div class="col-actions">${inEditMode ? `
            <button class="payment-edit-btn-text" onclick="editPaymentRow('${p.id}')">Edit</button>
            <button class="payment-delete-btn-text" onclick="deletePayment('${bill.id}','${p.id}')">Delete</button>
          ` : ''}</div>
        </div>`;
      }
    });
  } else {
    paymentsHtml += `<div class="no-payments">No payments recorded yet.</div>`;
  }

  const toggleBtn = hasMore ? `<div class="history-toggle">
    <button class="history-toggle-btn" onclick="toggleHistory('${bill.id}')">
      ${showAll ? '▲ Show less' : `▼ Show all ${payments.length} payments`}
    </button>
  </div>` : '';

  const paidLabel = hasPaid
    ? `<span class="bill-paid-status paid">✓ ${monthPayments.length} paid</span>`
    : `<span class="bill-paid-status unpaid">Not paid</span>`;

  const colorBarHtml = `<div class="bill-color-bar" style="background:${color}">${bill.name}</div>`;

  return `<div class="bill-card" id="billCard_${bill.id}">
    ${colorBarHtml}
    <div class="bill-header">
      <div class="bill-header-left">
        <div class="bill-title-row">
          <span class="freq-badge ${badgeClass}">${badgeLabel}</span>
          ${paidLabel}
        </div>
      </div>
      <div class="bill-header-actions">
        <button class="bill-quick-add-btn" onclick="openNewPayment('${bill.id}')" title="Log Payment">＋</button>
        ${inEditMode ? '' : `<button class="edit-payments-btn" onclick="toggleEditMode('${bill.id}')">Edit</button>`}
      </div>
    </div>
    ${inEditMode ? buildUnifiedEditPanel(bill) : ''}
    ${infoHtml}
    <div class="payments-section">
      ${paymentsHtml}
      ${toggleBtn}
    </div>
  </div>`;
}

function buildReadOnlyFieldsHtml(bill) {
  const fields = getBillFields(bill);
  if (fields.length === 0) return `<div class="bill-info-row"><span class="bill-info-value empty">No account info yet — tap Edit to add Account #, Telephone, etc.</span></div>`;
  const itemsHtml = fields.map(f =>
    `<div class="bill-info-item">
      <span class="bill-info-label">${f.label}:</span>
      <span class="bill-info-value">${f.value||'—'}</span>
    </div>`
  ).join('');
  return `<div class="bill-info-row">${itemsHtml}</div>`;
}

function buildEditableFieldsHtml(bill) {
  const rows = editingFields.map((f, i) => `
    <div class="bill-field-row">
      <input type="text" class="bill-info-input bill-field-label" id="editField_label_${bill.id}_${i}" value="${f.label}" placeholder="Field name">
      <input type="text" class="bill-info-input bill-field-value" id="editField_value_${bill.id}_${i}" value="${f.value}" placeholder="Value">
      <button type="button" class="method-row-remove" onclick="removeBillField('${bill.id}', ${i})" title="Remove">✕</button>
    </div>`).join('');
  return `<div class="bill-fields-editor">
    ${rows}
    <button type="button" class="method-row-add" onclick="addBillField('${bill.id}')">+ Add field</button>
  </div>`;
}

function syncFieldsFromDom(billId) {
  if (!editingFields) return;
  editingFields = editingFields.map((f, i) => {
    const labelEl = document.getElementById(`editField_label_${billId}_${i}`);
    const valueEl = document.getElementById(`editField_value_${billId}_${i}`);
    return {
      id: f.id,
      label: labelEl ? labelEl.value : f.label,
      value: valueEl ? valueEl.value : f.value,
    };
  });
}

function addBillField(billId) {
  syncFieldsFromDom(billId);
  editingFields.push({ id:'f'+Date.now(), label:'', value:'' });
  renderContent();
  requestAnimationFrame(() => {
    const el = document.getElementById(`editField_label_${billId}_${editingFields.length-1}`);
    if (el) el.focus();
  });
}

function removeBillField(billId, index) {
  syncFieldsFromDom(billId);
  editingFields.splice(index, 1);
  renderContent();
}

function methodSelectHtml(id, methods, selectedValue) {
  const opts = methods || [];
  const matches = opts.includes(selectedValue);
  const optionsHtml = opts.map(m => `<option value="${m}"${m===selectedValue?' selected':''}>${m}</option>`).join('');
  return `<select class="col-method inline-input" id="${id}">
    <option value=""${!matches?' selected':''}>Method</option>
    ${optionsHtml}
  </select>`;
}

function buildInlinePaymentRow(bill) {
  return `<div class="payment-row payment-row-editing">
    ${dateFieldHtml(`newPayStmt_${bill.id}`, 'col-stmt', autoStmtDate(bill))}
    ${dateFieldHtml(`newPayDate_${bill.id}`, 'col-pay', '')}
    <input type="number" class="col-amt inline-input" id="newPayAmount_${bill.id}" placeholder="0.00" step="0.01" inputmode="decimal">
    ${methodSelectHtml(`newPayMethod_${bill.id}`, bill.methods, '')}
    <input type="text" class="col-notes inline-input" id="newPayNotes_${bill.id}" placeholder="Notes">
    <div class="col-actions">
      <button class="payment-save-btn" onclick="saveInlinePayment('${bill.id}')">Save</button>
      <button class="payment-delete-btn" onclick="cancelInlinePayment()" title="Cancel">✕</button>
    </div>
  </div>`;
}

function buildEditPaymentRow(bill, p) {
  return `<div class="payment-row payment-row-editing">
    ${dateFieldHtml(`editPayStmt_${p.id}`, 'col-stmt', p.stmt||'')}
    ${dateFieldHtml(`editPayDate_${p.id}`, 'col-pay', p.date||'')}
    <input type="number" class="col-amt inline-input" id="editPayAmount_${p.id}" placeholder="0.00" step="0.01" inputmode="decimal" value="${p.amount}">
    ${methodSelectHtml(`editPayMethod_${p.id}`, bill.methods, p.method||'')}
    <input type="text" class="col-notes inline-input" id="editPayNotes_${p.id}" placeholder="Notes" value="${p.notes||''}">
    <div class="col-actions">
      <button class="payment-save-btn" onclick="saveEditedPayment('${bill.id}','${p.id}')">Save</button>
      <button class="payment-delete-btn" onclick="cancelEditPayment()" title="Cancel">✕</button>
    </div>
  </div>`;
}

function editPaymentRow(paymentId) {
  editingPaymentId = paymentId;
  renderContent();
}

function cancelEditPayment() {
  editingPaymentId = null;
  renderContent();
}

function saveEditedPayment(billId, paymentId) {
  const p = (data.payments[billId]||[]).find(x=>x.id===paymentId);
  if (!p) return;
  const stmt   = document.getElementById('editPayStmt_'+paymentId).value;
  const date   = document.getElementById('editPayDate_'+paymentId).value;
  const amount = document.getElementById('editPayAmount_'+paymentId).value;
  const method = document.getElementById('editPayMethod_'+paymentId).value.trim();
  const notes  = document.getElementById('editPayNotes_'+paymentId).value.trim();
  if (!date || !amount) { showToast('Please enter payment date and amount'); return; }
  p.stmt = stmt; p.date = date; p.amount = +amount; p.method = method; p.notes = notes;
  editingPaymentId = null;
  saveData();
  renderContent();
  showToast('Payment updated ✓');
}

function deletePayment(billId, paymentId) {
  if (!confirm('Delete this payment?')) return;
  data.payments[billId] = (data.payments[billId]||[]).filter(p=>p.id!==paymentId);
  if (editingPaymentId === paymentId) editingPaymentId = null;
  saveData();
  renderContent();
  showToast('Payment deleted ✓');
}

// A date field that stays completely empty (no native mm/dd/yyyy placeholder)
// until the calendar button is clicked, which reveals the native date picker.
const CALENDAR_ICON_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>';

function dateFieldHtml(id, colClass, prefillValue) {
  if (prefillValue) {
    return `<span class="date-field-wrap ${colClass}">
      <input type="date" class="date-field-input" id="${id}" value="${prefillValue}">
      <button type="button" class="date-field-btn" onclick="openDateField('${id}')" aria-label="Choose date">${CALENDAR_ICON_SVG}</button>
    </span>`;
  }
  return `<span class="date-field-wrap ${colClass}">
    <input type="text" class="date-field-input" id="${id}" value="" readonly>
    <button type="button" class="date-field-btn" onclick="openDateField('${id}')" aria-label="Choose date">${CALENDAR_ICON_SVG}</button>
  </span>`;
}

function openDateField(id) {
  const el = document.getElementById(id);
  el.type = 'date';
  el.removeAttribute('readonly');
  el.focus();
  if (el.showPicker) { try { el.showPicker(); } catch(e) {} }
  el.addEventListener('blur', function handler() {
    if (!el.value) { el.type = 'text'; el.setAttribute('readonly','readonly'); }
    el.removeEventListener('blur', handler);
  });
}

// A single, clearly-boxed "Edit Bill" form shown when a bill is in edit mode.
// Everything editable about the bill (besides individual payments) lives here,
// with normal labeled fields — nothing relies on tapping plain text to discover it.
function buildUnifiedEditPanel(bill) {
  const knownTypes = ['Monthly','Quarterly','Bimonthly','Annual','Semi-Annual'];
  const currentType = knownTypes.includes(bill.freq) ? bill.freq : 'Other';
  const dueDates = bill.dueDates || [];
  const freqOptsHtml = ['Monthly','Quarterly','Bimonthly','Annual','Semi-Annual','Other'].map(f => {
    const label = f==='Quarterly' ? 'Quarterly (Every 3 Months)' : f==='Bimonthly' ? 'Every 2 Months' : f;
    return `<option value="${f}" ${f===currentType?'selected':''}>${label}</option>`;
  }).join('');
  const showDate1 = currentType==='Annual' || currentType==='Semi-Annual';
  const showDate2 = currentType==='Semi-Annual';
  const stmtMode = bill.stmtDateMode === 'auto' ? 'auto' : 'manual';

  const methodRowsHtml = editingMethods.map((m, i) => `
    <div class="method-row">
      <span class="method-row-num">${i+1}.</span>
      <input type="text" class="bill-setting-input method-row-input" id="edit_method_${bill.id}_${i}" value="${m}" placeholder="e.g. Zelle">
      <button type="button" class="method-row-remove" onclick="removeEditMethodRow('${bill.id}', ${i})" title="Remove">✕</button>
    </div>`).join('');

  return `<div class="edit-panel">
    <div class="edit-panel-title">Edit Bill</div>

    <div class="edit-panel-row">
      <label for="edit_name_${bill.id}">Bill Name</label>
      <input type="text" class="edit-panel-input" id="edit_name_${bill.id}" value="${bill.name}">
    </div>

    <div class="edit-panel-row">
      <label for="edit_freqType_${bill.id}">Frequency</label>
      <select class="edit-panel-input" id="edit_freqType_${bill.id}" onchange="updateEditPanelFreqVisibility('${bill.id}')">${freqOptsHtml}</select>
    </div>
    <div class="edit-panel-row" id="edit_freqOtherRow_${bill.id}" style="display:${currentType==='Other'?'flex':'none'}">
      <label for="edit_freqOther_${bill.id}">Custom label</label>
      <input type="text" class="edit-panel-input" id="edit_freqOther_${bill.id}" placeholder="e.g. Every 6 weeks" value="${currentType==='Other' ? (bill.freq||'') : ''}">
    </div>
    <div class="edit-panel-row" id="edit_freqDate1Row_${bill.id}" style="display:${showDate1?'flex':'none'}">
      <label for="edit_freqDate1_${bill.id}">Due date</label>
      <input type="date" class="edit-panel-input" id="edit_freqDate1_${bill.id}" value="${dueDates[0]?('2000-'+dueDates[0]):''}">
    </div>
    <div class="edit-panel-row" id="edit_freqDate2Row_${bill.id}" style="display:${showDate2?'flex':'none'}">
      <label for="edit_freqDate2_${bill.id}">2nd due date</label>
      <input type="date" class="edit-panel-input" id="edit_freqDate2_${bill.id}" value="${dueDates[1]?('2000-'+dueDates[1]):''}">
    </div>

    <div class="edit-panel-row">
      <label for="edit_stmtMode_${bill.id}">Statement Date</label>
      <select class="edit-panel-input" id="edit_stmtMode_${bill.id}" onchange="updateEditPanelStmtVisibility('${bill.id}')">
        <option value="manual" ${stmtMode==='manual'?'selected':''}>Manual</option>
        <option value="auto" ${stmtMode==='auto'?'selected':''}>Auto (same day each month)</option>
      </select>
    </div>
    <div class="edit-panel-row" id="edit_stmtDayRow_${bill.id}" style="display:${stmtMode==='auto'?'flex':'none'}">
      <label for="edit_stmtDay_${bill.id}">Day of month</label>
      <input type="number" class="edit-panel-input" id="edit_stmtDay_${bill.id}" min="1" max="31" value="${bill.stmtDateDay||''}">
    </div>

    <div class="edit-panel-section-label">Payment Methods</div>
    <div class="method-rows">${methodRowsHtml}</div>
    <button type="button" class="method-row-add" onclick="addEditMethodRow('${bill.id}')">+ Add method</button>

    <div class="edit-panel-section-label">Account Info</div>
    ${buildEditableFieldsHtml(bill)}

    <div class="edit-panel-actions">
      <button class="bill-delete-btn-text" onclick="requestDeleteBill('${bill.id}')">Delete Bill</button>
      <span class="edit-panel-spacer"></span>
      <button class="btn-cancel-inline" onclick="cancelBillEdits('${bill.id}')">Cancel</button>
      <button class="bill-setting-save" onclick="saveBillEditPanel('${bill.id}')">Save Changes</button>
    </div>
    ${confirmDeleteBillId === bill.id ? `
      <div class="bill-delete-confirm">
        <span>Delete this bill?</span>
        <button class="tab-delete-confirm-btn confirm" onclick="deleteBill('${bill.id}')">Delete</button>
        <button class="tab-delete-confirm-btn cancel" onclick="cancelDeleteBill()">Cancel</button>
      </div>
    ` : ''}
  </div>`;
}

function updateEditPanelFreqVisibility(billId) {
  const type = document.getElementById('edit_freqType_'+billId).value;
  document.getElementById('edit_freqOtherRow_'+billId).style.display = type==='Other' ? 'flex' : 'none';
  document.getElementById('edit_freqDate1Row_'+billId).style.display = (type==='Annual'||type==='Semi-Annual') ? 'flex' : 'none';
  document.getElementById('edit_freqDate2Row_'+billId).style.display = type==='Semi-Annual' ? 'flex' : 'none';
}

function updateEditPanelStmtVisibility(billId) {
  const mode = document.getElementById('edit_stmtMode_'+billId).value;
  document.getElementById('edit_stmtDayRow_'+billId).style.display = mode==='auto' ? 'flex' : 'none';
}

function syncEditMethodsFromDom(billId) {
  if (!editingMethods) return;
  editingMethods = editingMethods.map((m, i) => {
    const el = document.getElementById(`edit_method_${billId}_${i}`);
    return el ? el.value : m;
  });
}

function addEditMethodRow(billId) {
  syncEditMethodsFromDom(billId);
  editingMethods.push('');
  renderContent();
  requestAnimationFrame(() => {
    const el = document.getElementById(`edit_method_${billId}_${editingMethods.length-1}`);
    if (el) el.focus();
  });
}

function removeEditMethodRow(billId, index) {
  syncEditMethodsFromDom(billId);
  editingMethods.splice(index, 1);
  if (editingMethods.length === 0) editingMethods.push('');
  renderContent();
}

function cancelBillEdits(billId) {
  editModeBill = null;
  editingFields = null;
  editingMethods = null;
  editingPaymentId = null;
  confirmDeleteBillId = null;
  renderContent();
}

function saveBillEditPanel(billId) {
  const name = document.getElementById('edit_name_'+billId).value.trim();
  if (!name) { showToast('Bill name cannot be empty'); return; }

  syncFieldsFromDom(billId);
  const fields = editingFields
    .map(f => ({ id:f.id, label:(f.label||'').trim(), value:(f.value||'').trim() }))
    .filter(f => f.label);

  syncEditMethodsFromDom(billId);
  const methods = editingMethods.map(s=>s.trim()).filter(Boolean);

  const freqType = document.getElementById('edit_freqType_'+billId).value;
  const freq = freqType === 'Other' ? (document.getElementById('edit_freqOther_'+billId).value.trim() || 'Other') : freqType;
  const dueDates = [];
  if (freqType === 'Annual' || freqType === 'Semi-Annual') {
    const d1 = document.getElementById('edit_freqDate1_'+billId).value;
    if (d1) dueDates.push(d1.slice(5));
  }
  if (freqType === 'Semi-Annual') {
    const d2 = document.getElementById('edit_freqDate2_'+billId).value;
    if (d2) dueDates.push(d2.slice(5));
  }

  const stmtDateMode = document.getElementById('edit_stmtMode_'+billId).value;
  const stmtDateDay  = stmtDateMode === 'auto' ? (+document.getElementById('edit_stmtDay_'+billId).value || null) : null;

  if (!data.billOverrides) data.billOverrides = {};
  const existing = data.billOverrides[billId] || {};
  data.billOverrides[billId] = { ...existing, name, fields, methods, freq, dueDates, stmtDateMode, stmtDateDay };

  if (stmtDateMode === 'auto' && stmtDateDay) {
    (data.payments[billId]||[]).forEach(p => {
      if (!p.stmt && p.date) p.stmt = stmtDateForMonth(p.date, stmtDateDay);
    });
  }

  editModeBill = null;
  editingFields = null;
  editingMethods = null;
  editingPaymentId = null;
  confirmDeleteBillId = null;
  saveData();
  renderContent();
  showToast('Bill updated ✓');
}

function saveInlinePayment(billId) {
  const stmt   = document.getElementById('newPayStmt_'+billId).value;
  const date   = document.getElementById('newPayDate_'+billId).value;
  const amount = document.getElementById('newPayAmount_'+billId).value;
  const method = document.getElementById('newPayMethod_'+billId).value.trim();
  const notes  = document.getElementById('newPayNotes_'+billId).value.trim();
  if (!date || !amount) { showToast('Please enter payment date and amount'); return; }

  if (!data.payments[billId]) data.payments[billId] = [];
  data.payments[billId].push({ id:Date.now()+'', stmt, date, amount:+amount, method, notes });

  addingPaymentBill = null;
  saveData(); renderContent();
  showToast('Payment saved ✓');
}

function cancelInlinePayment() {
  addingPaymentBill = null;
  renderContent();
}

// Opens the single "Edit Bill" panel for this bill. Saving/canceling out of
// edit mode happens via that panel's own Save Changes / Cancel buttons.
function toggleEditMode(billId) {
  const bill = getBill(billId);
  editingFields = getBillFields(bill).map(f => ({...f}));
  editingMethods = (bill.methods && bill.methods.length) ? [...bill.methods] : [''];
  editModeBill = billId;
  editingPaymentId = null;
  confirmDeleteBillId = null;
  renderContent();
}

function requestDeleteBill(billId) {
  confirmDeleteBillId = billId;
  renderContent();
}

function cancelDeleteBill() {
  confirmDeleteBillId = null;
  renderContent();
}

function deleteBill(billId) {
  if (!data.deletedBills) data.deletedBills = [];
  data.deletedBills.push(billId);
  confirmDeleteBillId = null;
  editModeBill = null;
  saveData();
  renderContent();
  showToast('Bill deleted ✓');
}

function toggleHistory(id) {
  showAllHistory[id] = !showAllHistory[id];
  renderContent();
}

// ═══════════════════════════════
//  PAY MODAL (new + edit)
// ═══════════════════════════════
function openNewPayment(billId) {
  addingPaymentBill = billId;
  showAllHistory[billId] = true;
  renderContent();
  requestAnimationFrame(() => {
    const card = document.getElementById('billCard_'+billId);
    if (card) card.scrollIntoView({ behavior:'smooth', block:'start' });
    const el = document.getElementById('newPayDate_'+billId);
    if (el) el.focus({ preventScroll:true });
  });
}

// ═══════════════════════════════
//  ADD BILL
// ═══════════════════════════════
function openAddBill() {
  const tab = allTabs().find(t=>t.id===activeTab);
  document.getElementById('addBillTabLabel').textContent = tab ? tab.label : '';
  document.getElementById('addBillSaveBtn').style.background = tab ? tab.color : '#007aff';
  ['nb_name','nb_acct','nb_acctName','nb_phone'].forEach(id => document.getElementById(id).value='');
  document.getElementById('nb_freq').value = 'Monthly';
  document.getElementById('addBillModal').classList.add('open');
}

function saveNewBill() {
  const name = document.getElementById('nb_name').value.trim();
  if (!name) { showToast('Please enter a bill name'); return; }
  const id = 'custom_'+Date.now();
  const newBill = {
    id, name,
    acct:     document.getElementById('nb_acct').value.trim(),
    acctName: document.getElementById('nb_acctName').value.trim(),
    phone:    document.getElementById('nb_phone').value.trim(),
    freq:     document.getElementById('nb_freq').value,
    typical:  null,
    methods:  [],
  };
  if (!data.customBills) data.customBills = {};
  if (!data.customBills[activeTab]) data.customBills[activeTab] = [];
  data.customBills[activeTab].push(newBill);
  saveData();
  document.getElementById('addBillModal').classList.remove('open');
  renderContent();
  showToast('Bill added ✓');
}

// ═══════════════════════════════
//  ADD TAB
// ═══════════════════════════════
let confirmDeleteTabId = null;

function openAddTab() {
  document.getElementById('nt_name').value = '';
  document.getElementById('nt_color').value = '#007aff';
  document.getElementById('nt_kind').value = 'recurring';
  confirmDeleteTabId = null;
  renderTabManageList();
  document.getElementById('addTabModal').classList.add('open');
}

function renderTabManageList() {
  const tabs = allTabs();
  document.getElementById('tabManageList').innerHTML = tabs.map((t, i) => {
    if (confirmDeleteTabId === t.id) {
      return `<div class="bill-picker-item" style="cursor:default">
        <span style="font-size:13px">Delete "${t.label}"?</span>
        <span>
          <button class="tab-delete-confirm-btn confirm" onclick="deleteTab('${t.id}')">Delete</button>
          <button class="tab-delete-confirm-btn cancel" onclick="cancelDeleteTab()">Cancel</button>
        </span>
      </div>`;
    }
    return `<div class="bill-picker-item" style="cursor:default">
      <span class="tab-reorder-btns">
        <button class="tab-reorder-btn" onclick="moveTab('${t.id}',-1)" ${i===0?'disabled':''} title="Move earlier">▲</button>
        <button class="tab-reorder-btn" onclick="moveTab('${t.id}',1)" ${i===tabs.length-1?'disabled':''} title="Move later">▼</button>
      </span>
      <span class="bill-picker-name" style="color:${t.color}">${t.label}</span>
      <button class="other-del" onclick="requestDeleteTab('${t.id}')" title="Delete tab">✕</button>
    </div>`;
  }).join('');
}

function requestDeleteTab(id) { confirmDeleteTabId = id; renderTabManageList(); }
function cancelDeleteTab() { confirmDeleteTabId = null; renderTabManageList(); }

function moveTab(id, direction) {
  const ids = allTabs().map(t=>t.id);
  const idx = ids.indexOf(id);
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= ids.length) return;
  [ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]];
  data.tabOrder = ids;
  saveData();
  renderTabManageList();
  renderTabs();
}

function deleteTab(id) {
  if (allTabs().length <= 1) { showToast('You need at least one tab'); return; }
  if (!data.deletedTabs) data.deletedTabs = [];
  data.deletedTabs.push(id);
  confirmDeleteTabId = null;
  saveData();
  if (activeTab === id) activeTab = allTabs()[0].id;
  renderTabManageList();
  renderTabs();
  renderContent();
  showToast('Tab deleted ✓');
}

function saveNewTab() {
  const name = document.getElementById('nt_name').value.trim();
  if (!name) { showToast('Please enter a tab name'); return; }
  const id = 'tab_'+Date.now();
  const kind = document.getElementById('nt_kind').value;
  if (!data.customTabs) data.customTabs = [];
  data.customTabs.push({ id, label:name, color:document.getElementById('nt_color').value, isProperty:false, kind });
  saveData();
  document.getElementById('addTabModal').classList.remove('open');
  activeTab = id;
  renderTabs(); renderContent();
  showToast('Tab added ✓');
}

// ═══════════════════════════════
//  OTHER EXPENSES
// ═══════════════════════════════
let editOtherId = null;

// This modal is now used only by property tabs' "Other Expenses" section
// (Teramo, Branch, etc). Non-recurring tab logs (Personal Care, Family, ...)
// use the inline row editor below instead — see buildInlineOtherRow / buildEditOtherRow.
function openAddOther() {
  editOtherId = null;
  const tab = allTabs().find(t=>t.id===activeTab);
  document.getElementById('otherModalTitle').textContent = 'Add Expense';
  document.getElementById('otherSubtitle').textContent = tab ? tab.label : '';
  document.getElementById('otherSaveBtn').style.background = tab ? tab.color : '#007aff';
  document.getElementById('otherTypeRow').style.display = 'flex';
  document.getElementById('otherProviderRow').style.display = 'flex';
  document.getElementById('otherTipRow').style.display = 'none';
  document.getElementById('otherNotesRow').style.display = 'flex';
  document.getElementById('otherProviderLabel').textContent = 'Provider / Name';
  document.getElementById('otherProvider').style.display = 'block';
  document.getElementById('otherProviderSelect').style.display = 'none';
  document.getElementById('otherDate').value = todayStr();
  ['otherType','otherProvider','otherAmount','otherTip','otherNotes'].forEach(id => document.getElementById(id).value='');
  document.getElementById('otherModal').classList.add('open');
}

function openEditOther(id) {
  const e = (data.otherExpenses||[]).find(x=>x.id===id);
  if (!e) return;
  editOtherId = id;
  const tab = allTabs().find(t=>t.id===e.tab);
  document.getElementById('otherModalTitle').textContent = 'Edit Expense';
  document.getElementById('otherSubtitle').textContent = tab ? tab.label : '';
  document.getElementById('otherSaveBtn').style.background = tab ? tab.color : '#007aff';
  document.getElementById('otherTypeRow').style.display = 'flex';
  document.getElementById('otherProviderRow').style.display = 'flex';
  document.getElementById('otherTipRow').style.display = 'none';
  document.getElementById('otherNotesRow').style.display = 'flex';
  document.getElementById('otherProviderLabel').textContent = 'Provider / Name';
  document.getElementById('otherProvider').style.display = 'block';
  document.getElementById('otherProviderSelect').style.display = 'none';
  document.getElementById('otherDate').value = e.date || '';
  document.getElementById('otherType').value = e.type || '';
  document.getElementById('otherProvider').value = e.provider || '';
  document.getElementById('otherAmount').value = e.amount || '';
  document.getElementById('otherTip').value = e.tip || '';
  document.getElementById('otherNotes').value = e.notes || '';
  document.getElementById('otherModal').classList.add('open');
}

function closeOtherModal() { document.getElementById('otherModal').classList.remove('open'); }

function saveOther() {
  const tab = allTabs().find(t=>t.id===activeTab);
  const date = document.getElementById('otherDate').value;
  const type = document.getElementById('otherType').value.trim();
  if (!date || !type) { showToast('Please enter date and type'); return; }
  const entry = {
    tab: activeTab, date, type,
    provider: document.getElementById('otherProvider').value.trim(),
    amount:   +document.getElementById('otherAmount').value||0,
    tip:      0,
    notes:    document.getElementById('otherNotes').value.trim(),
  };
  if (!data.otherExpenses) data.otherExpenses = [];
  if (editOtherId) {
    const idx = data.otherExpenses.findIndex(x=>x.id===editOtherId);
    if (idx>=0) data.otherExpenses[idx] = { id:editOtherId, ...entry };
  } else {
    data.otherExpenses.push({ id:Date.now()+'', ...entry });
  }
  saveData(); closeOtherModal(); renderContent();
  showToast(editOtherId ? 'Updated ✓' : 'Saved ✓');
}

// ═══════════════════════════════
//  NON-RECURRING LOG — inline edit mode (mirrors Bills' payment-row editing)
// ═══════════════════════════════
function toggleOtherLogEdit() {
  editingOtherLog = !editingOtherLog;
  editingOtherRowId = null;
  addingOtherRow = false;
  renderContent();
}

function buildLogColumnsPanel(tab) {
  const cols = tabColumns(tab);
  const checksHtml = OTHER_LOG_COLUMNS.map(c => `
    <label class="log-col-check">
      <input type="checkbox" id="logcol_${c.key}" ${cols.includes(c.key)?'checked':''} onchange="saveLogColumns('${tab.id}')">
      ${c.label}
    </label>`).join('');
  return `<div class="edit-panel">
    <div class="edit-panel-section-label">Columns Shown (Date &amp; Amount always included)</div>
    <div class="log-col-checks">${checksHtml}</div>
  </div>`;
}

function saveLogColumns(tabId) {
  const cols = OTHER_LOG_COLUMNS.map(c=>c.key).filter(key => document.getElementById('logcol_'+key).checked);
  if (!data.tabOverrides) data.tabOverrides = {};
  data.tabOverrides[tabId] = { ...(data.tabOverrides[tabId]||{}), columns: cols };
  saveData();
  renderContent();
}

function openAddOtherRow() {
  addingOtherRow = true;
  renderContent();
}

function cancelAddOtherRow() {
  addingOtherRow = false;
  renderContent();
}

function buildInlineOtherRow(tab) {
  const cols = tabColumns(tab);
  let cells = dateFieldHtml(`newOtherDate_${tab.id}`, 'col-stmt', todayStr());
  if (cols.includes('type')) cells += `<input type="text" class="inline-input" id="newOtherType_${tab.id}" placeholder="Type of Service" style="flex:1.2">`;
  if (cols.includes('provider')) {
    cells += tab.id === 'family'
      ? `<select class="inline-input" id="newOtherProvider_${tab.id}" style="flex:1">${FAMILY_MEMBERS.map(m=>`<option value="${m}" ${m===(tabMemberFilter||'')?'selected':''}>${m}</option>`).join('')}</select>`
      : `<input type="text" class="inline-input" id="newOtherProvider_${tab.id}" placeholder="Provider" style="flex:1">`;
  }
  cells += `<input type="number" class="col-amt inline-input" id="newOtherAmount_${tab.id}" placeholder="0.00" step="0.01" inputmode="decimal">`;
  if (cols.includes('tip')) cells += `<input type="number" class="col-amt inline-input" id="newOtherTip_${tab.id}" placeholder="0.00" step="0.01" inputmode="decimal">`;
  if (cols.includes('notes')) cells += `<input type="text" class="col-notes inline-input" id="newOtherNotes_${tab.id}" placeholder="Notes">`;
  return `<div class="payment-row payment-row-editing">
    ${cells}
    <div class="col-actions">
      <button class="payment-save-btn" onclick="saveInlineOther('${tab.id}')">Save</button>
      <button class="payment-delete-btn" onclick="cancelAddOtherRow()" title="Cancel">✕</button>
    </div>
  </div>`;
}

function saveInlineOther(tabId) {
  const tab = allTabs().find(t=>t.id===tabId);
  const cols = tabColumns(tab);
  const date = document.getElementById('newOtherDate_'+tabId).value;
  const type = cols.includes('type') ? document.getElementById('newOtherType_'+tabId).value.trim() : '';
  if (!date || (cols.includes('type') && !type)) { showToast('Please enter date' + (cols.includes('type')?' and type of service':'')); return; }
  const provider = cols.includes('provider') ? document.getElementById('newOtherProvider_'+tabId).value.trim() : '';
  const amount = +document.getElementById('newOtherAmount_'+tabId).value || 0;
  const tip = cols.includes('tip') ? (+document.getElementById('newOtherTip_'+tabId).value || 0) : 0;
  const notes = cols.includes('notes') ? document.getElementById('newOtherNotes_'+tabId).value.trim() : '';
  if (!data.otherExpenses) data.otherExpenses = [];
  data.otherExpenses.push({ id:Date.now()+'', tab:tabId, date, type, provider, amount, tip, notes });
  addingOtherRow = false;
  saveData(); renderContent();
  showToast('Saved ✓');
}

function editOtherRow(id) {
  editingOtherRowId = id;
  renderContent();
}

function cancelEditOtherRow() {
  editingOtherRowId = null;
  renderContent();
}

function buildEditOtherRow(tab, e) {
  const cols = tabColumns(tab);
  let cells = dateFieldHtml(`editOtherDate_${e.id}`, 'col-stmt', e.date||'');
  if (cols.includes('type')) cells += `<input type="text" class="inline-input" id="editOtherType_${e.id}" value="${e.type||''}" style="flex:1.2">`;
  if (cols.includes('provider')) {
    cells += tab.id === 'family'
      ? `<select class="inline-input" id="editOtherProvider_${e.id}" style="flex:1">${FAMILY_MEMBERS.map(m=>`<option value="${m}" ${m===e.provider?'selected':''}>${m}</option>`).join('')}</select>`
      : `<input type="text" class="inline-input" id="editOtherProvider_${e.id}" value="${e.provider||''}" style="flex:1">`;
  }
  cells += `<input type="number" class="col-amt inline-input" id="editOtherAmount_${e.id}" value="${e.amount}" step="0.01" inputmode="decimal">`;
  if (cols.includes('tip')) cells += `<input type="number" class="col-amt inline-input" id="editOtherTip_${e.id}" value="${e.tip||''}" step="0.01" inputmode="decimal">`;
  if (cols.includes('notes')) cells += `<input type="text" class="col-notes inline-input" id="editOtherNotes_${e.id}" value="${e.notes||''}">`;
  return `<div class="payment-row payment-row-editing">
    ${cells}
    <div class="col-actions">
      <button class="payment-save-btn" onclick="saveEditedOther('${e.id}')">Save</button>
      <button class="payment-delete-btn" onclick="cancelEditOtherRow()" title="Cancel">✕</button>
    </div>
  </div>`;
}

function saveEditedOther(id) {
  const e = (data.otherExpenses||[]).find(x=>x.id===id);
  if (!e) return;
  const tab = allTabs().find(t=>t.id===e.tab);
  const cols = tabColumns(tab);
  const date = document.getElementById('editOtherDate_'+id).value;
  const type = cols.includes('type') ? document.getElementById('editOtherType_'+id).value.trim() : '';
  if (!date || (cols.includes('type') && !type)) { showToast('Please enter date' + (cols.includes('type')?' and type of service':'')); return; }
  e.date = date;
  e.type = type;
  e.provider = cols.includes('provider') ? document.getElementById('editOtherProvider_'+id).value.trim() : '';
  e.amount = +document.getElementById('editOtherAmount_'+id).value || 0;
  e.tip = cols.includes('tip') ? (+document.getElementById('editOtherTip_'+id).value || 0) : 0;
  e.notes = cols.includes('notes') ? document.getElementById('editOtherNotes_'+id).value.trim() : '';
  editingOtherRowId = null;
  saveData(); renderContent();
  showToast('Updated ✓');
}

// ═══════════════════════════════
//  DELETE
// ═══════════════════════════════
function deleteOther(id) {
  if (!confirm('Delete this expense?')) return;
  data.otherExpenses = data.otherExpenses.filter(e=>e.id!==id);
  if (editingOtherRowId === id) editingOtherRowId = null;
  saveData(); renderContent();
  showToast('Deleted ✓');
}

// ═══════════════════════════════
//  SETTINGS
// ═══════════════════════════════
function openSettings() {
  document.getElementById('sheetsUrl').value = (data.settings||{}).sheetsUrl||'';
  document.getElementById('cloudSavedAt').textContent = 'Last saved to cloud: ' + fmtCloudTime(CloudStore.meta().savedAt);
  document.getElementById('versionsList').innerHTML = '';
  document.getElementById('settingsOverlay').classList.add('open');
}

function fmtCloudTime(iso) {
  if (!iso) return 'never';
  const d = new Date(iso);
  return isNaN(d) ? 'never' : d.toLocaleString();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

async function showVersions() {
  const list = document.getElementById('versionsList');
  list.innerHTML = '<p>Loading...</p>';
  let snaps;
  try {
    snaps = await CloudStore.listSnapshots();
  } catch (e) {
    list.innerHTML = '<p>Could not load versions. Check your connection.</p>';
    return;
  }
  if (!snaps.length) { list.innerHTML = '<p>No previous versions yet.</p>'; return; }
  list.innerHTML = snaps.map(s =>
    `<div class="version-row">
      <div><strong>Version ${s.version}</strong> · ${escapeHtml(fmtCloudTime(s.createdAt))}<span>${escapeHtml(s.updatedBy)}</span></div>
      <button onclick="restoreVersion(${s.id}, ${s.version})">Restore</button>
    </div>`).join('');
}

async function restoreVersion(id, version) {
  if (!confirm('Restore version ' + version + '? Your current data is kept as a new version, so this can be undone.')) return;
  try {
    await CloudStore.restoreSnapshot(id);
  } catch (e) {
    showToast('Restore failed. Check your connection.');
    return;
  }
  closeSettings();
  showToast('Restored version ' + version + '.');
}

async function signOut() {
  try { await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }); } catch (e) { /* the cookie may already be gone */ }
  location.replace('/login');
}

function closeSettings() { document.getElementById('settingsOverlay').classList.remove('open'); }
function saveSettings() {
  (data.settings=data.settings||{}).sheetsUrl = document.getElementById('sheetsUrl').value.trim();
  saveData(); closeSettings(); showToast('Settings saved');
}

function exportData() {
  document.getElementById('dataTransferBox').value = JSON.stringify(data);
  showToast('Data exported below — copy it');
}

function importData() {
  const raw = document.getElementById('dataTransferBox').value.trim();
  if (!raw) { showToast('Paste exported data first'); return; }
  if (!confirm('This will overwrite ALL current data with the pasted data. Continue?')) return;
  try {
    data = JSON.parse(raw);
    saveData();
    renderTabs();
    renderContent();
    showToast('Data imported ✓');
  } catch (e) {
    showToast('Invalid data — could not import');
  }
}

// ═══════════════════════════════
//  GOOGLE SHEETS SYNC
// ═══════════════════════════════
async function syncToSheets() {
  const url = (data.settings||{}).sheetsUrl;
  if (!url) { showToast('Set up Google Sheets URL in ⚙️ Settings'); return; }
  const btn = document.querySelector('.sync-btn');
  btn.textContent='⏳ Syncing...'; btn.disabled=true;
  try {
    const rows = [];
    allTabs().forEach(tab => {
      allBills(tab.id).forEach(bill => {
        (data.payments[bill.id]||[]).forEach(p => {
          rows.push({ tab:tab.label, bill:bill.name, stmt:p.stmt||'', date:p.date, amount:p.amount, method:p.method||'', notes:p.notes||'' });
        });
      });
      (data.otherExpenses||[]).filter(e=>e.tab===tab.id).forEach(e => {
        rows.push({ tab:tab.label, bill:e.type, stmt:'', date:e.date, amount:e.amount||0, method:e.provider||'', notes:e.notes||'' });
      });
    });
    await fetch(url, { method:'POST', mode:'no-cors', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'sync',rows}) });
    showToast('Synced to Google Sheets ✓');
  } catch(e) { showToast('Sync failed — check URL in Settings'); }
  btn.textContent='☁️  Sync to Google Sheets'; btn.disabled=false;
}

// ═══════════════════════════════
//  UTILS
// ═══════════════════════════════
function todayStr() { return new Date().toISOString().split('T')[0]; }
function ordinal(n) {
  n = +n;
  if (!n) return '';
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return n + 'th';
  const rem10 = n % 10;
  return n + ({1:'st',2:'nd',3:'rd'}[rem10] || 'th');
}
function formatDueDates(dueDates) {
  if (!dueDates || !dueDates.length) return '';
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return dueDates.map(d => {
    const [m, day] = d.split('-').map(Number);
    return `${names[m-1]} ${day}`;
  }).join(' & ');
}
function stmtDateForMonth(dateStr, day) {
  const [y,m] = dateStr.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const d = Math.min(+day, daysInMonth);
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function autoStmtDate(bill) {
  if (bill.stmtDateMode !== 'auto' || !bill.stmtDateDay) return '';
  return stmtDateForMonth(todayStr(), bill.stmtDateDay);
}
function fmtDate(d) {
  if (!d) return '—';
  const [y,m,day] = d.split('-');
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m-1]+' '+parseInt(day)+', '+y;
}
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2500);
}

init();
