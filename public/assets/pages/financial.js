function inr(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }

function calcSIP() {
  const P = parseFloat(document.getElementById('sipAmt').value) || 0;
  const years = parseFloat(document.getElementById('sipYears').value) || 0;
  const annualRate = parseFloat(document.getElementById('sipRate').value) || 0;
  const n = years * 12;
  const r = annualRate / 100 / 12;
  const fv = r === 0 ? P * n : P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  document.getElementById('sipResult').style.display = 'block';
  document.getElementById('sipBig').textContent = inr(fv);
  document.getElementById('sipInvested').textContent = inr(P * n);
}

function calcPPF() {
  const P = parseFloat(document.getElementById('ppfAmt').value) || 0;
  let years = parseFloat(document.getElementById('ppfYears').value) || 0;
  if (years < 15) years = 15;
  const r = (parseFloat(document.getElementById('ppfRate').value) || 0) / 100;
  let balance = 0;
  for (let i = 0; i < years; i++) {
    balance = (balance + P) * (1 + r);
  }
  document.getElementById('ppfResult').style.display = 'block';
  document.getElementById('ppfBig').textContent = inr(balance);
  document.getElementById('ppfInvested').textContent = inr(P * years);
}

document.addEventListener('DOMContentLoaded', () => {
  const sipBtn = document.getElementById('sipCalcBtn');
  if (sipBtn) sipBtn.addEventListener('click', calcSIP);
  const ppfBtn = document.getElementById('ppfCalcBtn');
  if (ppfBtn) ppfBtn.addEventListener('click', calcPPF);
});
