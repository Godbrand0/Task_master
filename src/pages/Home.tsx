import React from "react";
import { NavLink } from "react-router-dom";

const Home: React.FC = () => (
  <div>
    <section className="container" style={{ paddingTop: "var(--space-12)", paddingBottom: "var(--space-12)" }}>
      <div className="stack-6">
        <h1 className="headline" style={{ fontSize: "clamp(48px, 8vw, 84px)", lineHeight: 1 }}>
          TASKMASTER
        </h1>
        <p className="headline-long" style={{ fontSize: "clamp(18px, 2.5vw, 24px)", maxWidth: 820, color: "color-mix(in oklab, var(--color-ink), black 10%)" }}>
          Create bounties, assign work, and release funds when it’s done. A streamlined, human‑centric project board on Stellar.
        </p>
        <div className="cluster">
          <NavLink to="/taskmaster?filter=created" className="btn btn-primary">Launch TaskMaster</NavLink>
        </div>
      </div>
    </section>

    <section className="container" style={{ paddingBottom: "var(--space-16)" }}>
      <div className="cluster" style={{ gap: "var(--space-6)", alignItems: "stretch" }}>
        <div className="card" style={{ flex: 1, minWidth: 260 }}>
          <h3 className="headline-long" style={{ marginTop: 0 }}>Bounty Workflow</h3>
          <p>Create tasks with funding and deadlines, then track status to release funds.</p>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 260 }}>
          <h3 className="headline-long" style={{ marginTop: 0 }}>Your Views</h3>
          <p>Quick filters for tasks you created and those assigned to you.</p>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 260 }}>
          <h3 className="headline-long" style={{ marginTop: 0 }}>On-Chain Settlement</h3>
          <p>Approve completed work and release funds securely on Stellar.</p>
        </div>
      </div>
    </section>
  </div>
);

export default Home;
