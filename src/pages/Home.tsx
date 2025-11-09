import React from "react";
import { NavLink } from "react-router-dom";

const Home: React.FC = () => (
  <div>
    <section className="container pt-2 pb-2">
      <div className="space-y-6">
        <h1 className="headline text-[clamp(48px,8vw,84px)] leading-none">
          Taskify
        </h1>
        <p className="headline-long text-[clamp(18px,2.5vw,24px)] max-w-[820px]" style={{ color: "color-mix(in oklab, var(--color-ink), black 10%)" }}>
          Create bounties, assign work, and release funds when it's done. A streamlined, human‑centric project board on Stellar.
        </p>
        <div className="flex flex-wrap gap-3">
          <NavLink to="/taskmaster?filter=created" className="btn btn-primary">Launch Taskify</NavLink>
        </div>
      </div>
    </section>

    <section className="container pb-16 w-full">
      <div className="flex flex-wrap gap-6 items-stretch">
        <div className="card flex-1 ">
          <h3 className="headline-long mt-0 font-bold text-3xl py-4">Bounty Workflow</h3>
          <p>Create tasks with funding and deadlines, then track status to release funds.</p>
        </div>
        <div className="card flex-1">
          <h3 className="headline-long mt-0 font-bold text-3xl py-4">Your Views</h3>
          <p>Quick filters for tasks you created and those assigned to you.</p>
        </div>
        <div className="card flex-1">
          <h3 className="headline-long mt-0 font-bold text-3xl py-4">On-Chain Settlement</h3>
          <p>Approve completed work and release funds securely on Stellar.</p>
        </div>
      </div>
    </section>
  </div>
);

export default Home;
