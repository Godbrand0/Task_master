import { Layout } from "@stellar/design-system";
import styles from "./App.module.css";
import ConnectAccount from "./components/ConnectAccount.tsx";
import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/taskmaster/Dashboard";
import TaskDetails from "./pages/taskmaster/TaskDetails";

const AppLayout: React.FC = () => (
  <main className={styles.appMain}>
    <div className={styles.appHeader}>
      <Layout.Header
        projectId="Taskify"
        projectTitle="Taskify"
        contentRight={
          <>
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
        <Route path="/taskmaster/task/:taskId" element={<TaskDetails />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;