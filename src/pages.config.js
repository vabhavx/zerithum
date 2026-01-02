import Dashboard from './pages/Dashboard';
import ConnectedPlatforms from './pages/ConnectedPlatforms';
import Reconciliation from './pages/Reconciliation';
import TaxReports from './pages/TaxReports';
import Settings from './pages/Settings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "ConnectedPlatforms": ConnectedPlatforms,
    "Reconciliation": Reconciliation,
    "TaxReports": TaxReports,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};