const loanTypes = {
  'personal-loan': {
    name: 'Personal Loan',
    maxAmount: '₹50 Lakh',
    rate: '9.99',
    tenure: '60 months',
    popup: 'Personal Loan',
    desc: 'unsecured personal loan',
  },
  'business-loan': {
    name: 'Business Loan',
    maxAmount: '₹1 Crore',
    rate: '10.99',
    tenure: '84 months',
    popup: 'Business Loan',
    desc: 'unsecured business loan',
  },
  'home-loan': {
    name: 'Home Loan',
    maxAmount: '₹5 Crore',
    rate: '8.50',
    tenure: '360 months',
    popup: 'Home Loan',
    desc: 'home loan',
  },
  'instant-loan': {
    name: 'Instant Loan',
    maxAmount: '₹5 Lakh',
    rate: '9.99',
    tenure: '60 months',
    popup: 'Instant Loan',
    desc: 'instant personal loan',
  },
};

const cities = {
  delhi:      { name: 'Delhi',      state: 'Delhi' },
  mumbai:     { name: 'Mumbai',     state: 'Maharashtra' },
  bangalore:  { name: 'Bangalore',  state: 'Karnataka' },
  hyderabad:  { name: 'Hyderabad',  state: 'Telangana' },
  pune:       { name: 'Pune',       state: 'Maharashtra' },
  chennai:    { name: 'Chennai',    state: 'Tamil Nadu' },
  kolkata:    { name: 'Kolkata',    state: 'West Bengal' },
  ahmedabad:  { name: 'Ahmedabad',  state: 'Gujarat' },
  noida:      { name: 'Noida',      state: 'Uttar Pradesh' },
  gurugram:   { name: 'Gurugram',   state: 'Haryana' },
  ghaziabad:  { name: 'Ghaziabad',  state: 'Uttar Pradesh' },
  faridabad:  { name: 'Faridabad',  state: 'Haryana' },
  jaipur:     { name: 'Jaipur',     state: 'Rajasthan' },
  lucknow:    { name: 'Lucknow',    state: 'Uttar Pradesh' },
  chandigarh: { name: 'Chandigarh', state: 'Punjab' },
  indore:     { name: 'Indore',     state: 'Madhya Pradesh' },
  surat:      { name: 'Surat',      state: 'Gujarat' },
  nagpur:     { name: 'Nagpur',     state: 'Maharashtra' },
  patna:      { name: 'Patna',      state: 'Bihar' },
  bhopal:     { name: 'Bhopal',     state: 'Madhya Pradesh' },
  vadodara:   { name: 'Vadodara',   state: 'Gujarat' },
  rajkot:     { name: 'Rajkot',     state: 'Gujarat' },
  ludhiana:   { name: 'Ludhiana',   state: 'Punjab' },
  coimbatore: { name: 'Coimbatore', state: 'Tamil Nadu' },
  kochi:      { name: 'Kochi',      state: 'Kerala' },
  thane:      { name: 'Thane',      state: 'Maharashtra' },
};

// slug format: personal-loan-delhi, business-loan-mumbai
function getPage(slug) {
  // match loanType-city
  const loanTypeKeys = Object.keys(loanTypes).sort((a, b) => b.length - a.length);
  let loanKey = null;
  let cityKey = null;

  for (const key of loanTypeKeys) {
    if (slug.startsWith(key + '-')) {
      loanKey = key;
      cityKey = slug.slice(key.length + 1);
      break;
    }
  }

  if (!loanKey || !cityKey) return null;
  const loan = loanTypes[loanKey];
  const city = cities[cityKey];
  if (!loan || !city) return null;

  return {
    slug,
    loanKey,
    cityKey,
    loanName: loan.name,
    cityName: city.name,
    state: city.state,
    maxAmount: loan.maxAmount,
    rate: loan.rate,
    tenure: loan.tenure,
    popup: loan.popup,
    desc: loan.desc,
    title: `${loan.name} in ${city.name} — Starting @ ${loan.rate}% p.a. | KreditSeva`,
    metaDesc: `Apply for ${loan.name} in ${city.name}. Compare offers from 90+ banks & NBFCs. Interest rates starting ${loan.rate}% p.a. Quick approval, minimal documentation.`,
    heroDesc: `Looking for a ${loan.desc} in ${city.name}? KreditSeva helps you compare offers from 90+ lenders and get the best rate — fast approval, no collateral, 100% online.`,
    whatDesc1: `A ${loan.name} in ${city.name} is now easier than ever. Whether you need funds for personal needs, business expansion, or home purchase — KreditSeva connects you to the best lenders in ${city.name}, ${city.state}.`,
    whatDesc2: `With 90+ bank and NBFC partners, KreditSeva finds you the lowest interest rate for your ${loan.name} in ${city.name} — completely free, with expert support at every step.`,
  };
}

module.exports = { getPage };
