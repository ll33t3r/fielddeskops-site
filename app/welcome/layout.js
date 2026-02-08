const pageTitle = "FieldDeskOps — Job Management for Contractors | Estimates, Photos, Contracts & Inventory";
const pageDescription =
  "Stop leaving money on the table. One platform for estimates (ProfitLock), photo docs (SiteSnap), digital contracts (SignOff), and inventory (LoadOut). Sign up free or start a 7-day Pro trial.";

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/welcome",
  },
  twitter: {
    title: pageTitle,
    description: pageDescription,
  },
};

export default function WelcomeLayout({ children }) {
  return children;
}
