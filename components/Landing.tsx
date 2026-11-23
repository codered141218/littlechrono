"use client";
import { motion, MotionConfig } from "motion/react";
import Link from "next/link";
import { ACCENTS } from "@/lib/kinds";
import type { Me, MomentKind } from "@/lib/types";
import { AccountMenu, SignInButton } from "./Account";
import { Doodle, Logo, PlusIcon } from "./Icons";

const DEMO: { age: string; title: string; kind: MomentKind; seed?: number; by?: string }[] = [
  { age: "Birth day", title: "Hello, world", kind: "milestone" },
  { age: "4 days old", title: "First bath, big opinions", kind: "first", seed: 2 },
  { age: "6 weeks old", title: "The first real smile", kind: "everyday", seed: 0 },
  { age: "3 months old", title: "Sleepy at Grandma's", kind: "friend", by: "Grandma Lu" },
  { age: "4 months old", title: "Rolled over, then cried about it", kind: "milestone" },
  { age: "6 months old", title: "First tooth", kind: "first", seed: 0 },
  { age: "8 months old", title: "Banana, everywhere", kind: "everyday", seed: 2 },
  { age: "11 months old", title: "Three wobbly steps", kind: "growth" },
  { age: "1 year old", title: "Cake face", kind: "celebration" },
];

function DemoCard({ d, i }: { d: (typeof DEMO)[number]; i: number }) {
  const a = ACCENTS[i % ACCENTS.length];
  return (
    <div className="hang" style={{ ["--accent" as string]: a.hex }}>
      <div className="card" style={{ padding: "10px 10px 14px" }}>
        <span className="peg" aria-hidden />
        <div className="no-photo" style={{ aspectRatio: "4 / 3", marginBottom: 12 }}>
          <Doodle kind={d.kind} seed={d.seed} />
        </div>
        <div className="card-meta">
          <span className="age-chip">{d.age}</span>
        </div>
        <h3 className="card-title" style={{ fontSize: 19 }}>{d.title}</h3>
        {d.by && (
          <span className="byline" style={{ fontSize: 13 }}>
            <span className="avatar" style={{ width: 24, height: 24, fontSize: 11 }}>{d.by[0]}</span>
            Shared by {d.by}
          </span>
        )}
      </div>
    </div>
  );
}

export function Landing({ me }: { me: Me | null }) {
  const signIn = Boolean(me?.authEnabled && !me.user);
  const loop = [...DEMO, ...DEMO];
  return (
    <MotionConfig reducedMotion="user">
      <header className="topbar">
        <Link href="/" className="logo">
          <Logo />
          <span>LittleChrono</span>
        </Link>
        <div className="topbar-actions">
          {signIn ? (
            <SignInButton className="btn btn-sm" label="Sign in" callbackUrl="/" />
          ) : (
            <Link href="/start" className="btn btn-sm btn-primary">
              Start a timeline
            </Link>
          )}
          <AccountMenu me={me?.user ? me : null} />
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <motion.h1
            className="display"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 16 }}
          >
            Every first, in the order it happened.
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
            Add your baby&apos;s moments and photos as they happen. LittleChrono strings them onto one animated timeline,
            and friends can add their own photos with a link.
          </motion.p>
          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            {signIn ? (
              <SignInButton className="btn btn-primary" label="Start with Google" callbackUrl="/start" />
            ) : (
              <Link href="/start" className="btn btn-primary">
                <PlusIcon size={20} /> Start your baby&apos;s timeline
              </Link>
            )}
            <a href="#how" className="btn">
              How it works
            </a>
          </motion.div>
        </section>

        <div className="line-stage" aria-label="Example timeline of a baby's first year">
          <div className="line-rope" />
          <div className="line-track">
            {loop.map((d, i) => (
              <DemoCard key={i} d={d} i={i} />
            ))}
          </div>
        </div>

        <section className="how" id="how">
          {[
            {
              t: "Start a timeline",
              p: "Sign in with Google and add your baby's name, birthday and birth details. Keep one timeline for each little one.",
            },
            {
              t: "Add moments as they happen",
              p: "Snap photos, write the story. Dates are read from your photos, and every moment lands in the right spot.",
            },
            {
              t: "Share the link",
              p: "Family and friends watch the story play and add photos of their own, straight onto the timeline.",
            },
          ].map((s, i) => (
            <div className="how-step" key={s.t}>
              <span className="n">{i + 1}</span>
              <h3>{s.t}</h3>
              <p>{s.p}</p>
            </div>
          ))}
        </section>
      </main>
    </MotionConfig>
  );
}
