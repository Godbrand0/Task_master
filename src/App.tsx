import { Button, Icon, Layout } from "@stellar/design-system";
import styles from "./App.module.css";
import ConnectAccount from "./components/ConnectAccount.tsx";
import { Routes, Route, Outlet, Navigate, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/taskmaster/Dashboard";

const AppLayout: React.FC = () => (
  <main className={styles.appMain}>
    <div className={styles.appHeader}>
      <Layout.Header
        projectId="TaskMaster"
        projectTitle="TaskMaster"
        contentRight={
          <>
            <nav className={styles.navBar}>
              <NavLink
                to="/taskmaster"
                className={({ isActive }) => isActive ? styles.navButton : "no-underline"}
              >
                {({ isActive }) => (
                  <Button
                    variant="tertiary"
                    size="md"
                    className={styles.navButton}
                    onClick={() => (window.location.href = "/taskmaster")}
                    disabled={isActive}
                  >
                    <Icon.FileX02 size="md" />
                    TaskMaster
                  </Button>
                )}
              </NavLink>
            </nav>
            <ConnectAccount />
          </>
        }
      />
    </div>
    <div className={styles.appContent}>
      <Outlet />
    </div>
    <div className={styles.appFooter}>
      <Layout.Footer>
        <span>
          © {new Date().getFullYear()} TaskMaster. Licensed under the{" "}
          <a
            href="http://www.apache.org/licenses/LICENSE-2.0"
            target="_blank"
            rel="noopener noreferrer"
          >
            Apache License, Version 2.0
          </a>
          .
        </span>
      </Layout.Footer>
    </div>
  </main>
);

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/taskmaster" element={<Dashboard />} />
        <Route path="/taskmaster/:taskId" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
