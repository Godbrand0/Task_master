import { Button, Icon, Layout } from "@stellar/design-system";
import styles from "./App.module.css";
import ConnectAccount from "./components/ConnectAccount.tsx";
import { Routes, Route, Outlet, NavLink, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Debugger from "./pages/Debugger.tsx";
import Dashboard from "./pages/taskmaster/Dashboard";

const AppLayout: React.FC = () => (
  <main className={styles.appMain}>
    <div className={styles.appHeader}>
      <Layout.Header
        projectId="My App"
        projectTitle="My App"
        contentRight={
          <>
            <nav className={styles.navBar}>
              <NavLink
                to="/taskmaster"
                style={{
                  textDecoration: "none",
                }}
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
              <NavLink
                to="/debug"
                style={{
                  textDecoration: "none",
                }}
              >
                {({ isActive }) => (
                  <Button
                    variant="tertiary"
                    size="md"
                    className={styles.navButton}
                    onClick={() => (window.location.href = "/debug")}
                    disabled={isActive}
                  >
                    <Icon.Code02 size="md" />
                    Debugger
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
          © {new Date().getFullYear()} My App. Licensed under the{" "}
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
        <Route path="/debug" element={<Debugger />} />
        <Route path="/debug/:contractName" element={<Debugger />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
