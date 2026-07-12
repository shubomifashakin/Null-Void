import { backendUrl } from "@/data-service/mutations";

function GoogleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  const h = "absolute w-[7px] h-[7px] border z-10";
  const hStyle = {
    backgroundColor: "var(--nv-handle-bg)",
    borderColor: "var(--nv-handle-border)",
  };
  return (
    <div className="relative">
      <div
        className="absolute inset-0 border pointer-events-none"
        style={{ borderColor: "var(--nv-frame-border)" }}
      />
      <div className={`${h} top-[-3.5px] left-[-3.5px]`} style={hStyle} />
      <div className={`${h} top-[-3.5px] right-[-3.5px]`} style={hStyle} />
      <div className={`${h} bottom-[-3.5px] left-[-3.5px]`} style={hStyle} />
      <div className={`${h} bottom-[-3.5px] right-[-3.5px]`} style={hStyle} />
      {children}
    </div>
  );
}

export default function Page() {
  return (
    <main className="min-h-screen font-sans bg-background text-foreground flex items-center justify-center px-6 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            "linear-gradient(var(--nv-grid-line, rgba(255,255,255,0.07)) 1px, transparent 1px)",
            "linear-gradient(90deg, var(--nv-grid-line, rgba(255,255,255,0.07)) 1px, transparent 1px)",
          ].join(","),
          backgroundSize: "52px 52px",
        }}
      />

      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 35%, var(--background) 100%)",
        }}
      />

      <div
        className="absolute hidden sm:block -rotate-6"
        style={{
          top: "12%",
          left: "7%",
          animation: "fadeIn 700ms cubic-bezier(0.23,1,0.32,1) 350ms both",
        }}
      >
        <Frame>
          <svg width="112" height="112" viewBox="0 0 112 112" fill="none">
            <rect
              x="6"
              y="6"
              width="62"
              height="62"
              rx="4"
              style={{ fill: "var(--nv-shape-fill-solid)" }}
            />
            <rect
              x="38"
              y="38"
              width="62"
              height="62"
              rx="4"
              style={{
                fill: "var(--nv-shape-fill-ghost)",
                stroke: "var(--nv-shape-stroke-ghost)",
              }}
              strokeWidth="1.5"
            />
          </svg>
        </Frame>
      </div>

      <div
        className="absolute hidden sm:block rotate-3"
        style={{
          top: "9%",
          right: "8%",
          animation: "fadeIn 700ms cubic-bezier(0.23,1,0.32,1) 500ms both",
        }}
      >
        <Frame>
          <svg width="108" height="108" viewBox="0 0 108 108" fill="none">
            <circle cx="54" cy="54" r="48" fill="#E8B84B" />
            <circle cx="54" cy="54" r="33" fill="#F5D27A" />
            <circle cx="54" cy="54" r="16" fill="#C9960E" />
          </svg>
        </Frame>
      </div>

      <div
        className="absolute hidden sm:block rotate-[8deg]"
        style={{
          bottom: "11%",
          left: "7%",
          animation: "fadeIn 700ms cubic-bezier(0.23,1,0.32,1) 420ms both",
        }}
      >
        <Frame>
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
            <polygon points="50,6 96,88 4,88" style={{ fill: "var(--nv-shape-fill-solid)" }} />
          </svg>
        </Frame>
      </div>

      <div
        className="absolute hidden sm:block rotate-[-4deg]"
        style={{
          bottom: "10%",
          right: "7%",
          animation: "fadeIn 700ms cubic-bezier(0.23,1,0.32,1) 560ms both",
        }}
      >
        <Frame>
          <svg width="128" height="108" viewBox="0 0 128 108" fill="none">
            <circle cx="42" cy="54" r="38" style={{ fill: "var(--nv-shape-fill-solid)" }} />
            <circle
              cx="86"
              cy="54"
              r="38"
              style={{
                fill: "var(--nv-shape-fill-ghost)",
                stroke: "var(--nv-shape-stroke-ghost)",
              }}
              strokeWidth="1.5"
            />
          </svg>
        </Frame>
      </div>

      <div className="relative z-10 text-center">
        <p
          className="text-[11px] font-semibold uppercase mb-8"
          style={{
            letterSpacing: "0.22em",
            color: "var(--nv-fg-subtle)",
            animation: "fadeUp 550ms cubic-bezier(0.23,1,0.32,1) 0ms both",
          }}
        >
          Collaborative Canvas
        </p>

        <h1
          style={{
            fontSize: "clamp(3.5rem, 8vw, 6rem)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.0,
            fontOpticalSizing: "auto",
            animation: "fadeUp 550ms cubic-bezier(0.23,1,0.32,1) 70ms both",
          }}
        >
          Null Void
        </h1>

        <div
          style={{
            width: 36,
            height: 1,
            background: "var(--nv-divider)",
            margin: "26px auto",
            animation: "fadeUp 550ms cubic-bezier(0.23,1,0.32,1) 120ms both",
          }}
        />

        <p
          className="text-[15px] leading-relaxed max-w-[272px] mx-auto mb-10"
          style={{
            color: "var(--nv-fg-muted)",
            animation: "fadeUp 550ms cubic-bezier(0.23,1,0.32,1) 170ms both",
          }}
        >
          A shared canvas where you and your team create and collaborate in
          real-time.
        </p>

        <div
          style={{
            animation: "fadeUp 550ms cubic-bezier(0.23,1,0.32,1) 240ms both",
          }}
        >
          <a href={`${backendUrl}/auth`}>
            <button
              className="cta-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                padding: "0 28px",
                height: "52px",
                backgroundColor: "var(--foreground)",
                color: "var(--background)",
                fontSize: "15px",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                borderRadius: "9999px",
                border: "none",
                cursor: "pointer",
                outline: "none",
                WebkitAppearance: "none",
              }}
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </a>
        </div>
      </div>
    </main>
  );
}
