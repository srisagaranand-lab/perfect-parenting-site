const PRODUCTS = [
  { name: "Convertible Car Seat, 0–7 yrs", cat: "car-seats", amazon: 12999, flipkart: 11499, firstcry: 12250, quick: null },
  { name: "Lightweight Travel Stroller", cat: "strollers", amazon: 8499, flipkart: 8999, firstcry: 7999, quick: null },
  { name: "Electric Breast Pump", cat: "feeding", amazon: 5499, flipkart: 5299, firstcry: 5799, quick: 6199 },
  { name: "Anti-Colic Feeding Bottle Set", cat: "feeding", amazon: 899, flipkart: 849, firstcry: 949, quick: 999 },
  { name: "Diaper Pack, Size M (72 pcs)", cat: "diapering", amazon: 799, flipkart: 779, firstcry: 819, quick: 849 },
  { name: "Diaper Rash Cream 100g", cat: "diapering", amazon: 249, flipkart: 239, firstcry: 259, quick: 279 },
  { name: "Nursery Glider Chair", cat: "nursery", amazon: 15999, flipkart: 15499, firstcry: 16499, quick: null },
  { name: "Baby Monitor with Camera", cat: "nursery", amazon: 4999, flipkart: 4799, firstcry: 5299, quick: null },
  { name: "3-in-1 Travel System Stroller", cat: "strollers", amazon: 18999, flipkart: 17999, firstcry: 18499, quick: null },
  { name: "Infant Car Seat, 0–15 months", cat: "car-seats", amazon: 9499, flipkart: 9299, firstcry: 9799, quick: null },
];

function fmt(v) { return v == null ? "—" : "₹" + v.toLocaleString("en-IN"); }

function render(cat) {
  const body = document.getElementById("compareBody");
  body.innerHTML = "";
  const rows = cat === "all" ? PRODUCTS : PRODUCTS.filter(p => p.cat === cat);
  rows.forEach(p => {
    const prices = [p.amazon, p.flipkart, p.firstcry, p.quick].filter(v => v != null);
    const min = Math.min(...prices);
    const cell = (v) => `<td class="price-cell${v === min ? ' lowest' : ''}">${fmt(v)}</td>`;
    const tr = document.createElement("tr");
    // No inline onclick here — CSP (script-src 'self') blocks inline handlers even when
    // injected via innerHTML, so the "+ Add" click is handled via delegation below instead.
    tr.innerHTML = `
      <td><strong>${p.name}</strong></td>
      ${cell(p.amazon)}${cell(p.flipkart)}${cell(p.firstcry)}${cell(p.quick)}
      <td><button class="btn btn-sm btn-outline" data-add-product>+ Add</button></td>
    `;
    body.appendChild(tr);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById("filterRow").addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-chip");
    if (!btn) return;
    document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    render(btn.dataset.cat);
  });

  // Event delegation for the dynamically-rendered "+ Add" buttons
  document.getElementById("compareBody").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add-product]");
    if (!btn) return;
    showToast('Added — pick a registry on the next screen');
  });

  const params = new URLSearchParams(location.search);
  const initialCat = params.get("cat") || "all";
  const match = document.querySelector(`.filter-chip[data-cat="${initialCat}"]`);
  if (match) {
    document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
    match.classList.add("active");
  }
  render(initialCat);
});
