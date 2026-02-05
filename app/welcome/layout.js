const pageTitle = "Welcome";
const pageDescription =
  "Discover FieldDeskOps and start a free trial for your field operations.";

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
