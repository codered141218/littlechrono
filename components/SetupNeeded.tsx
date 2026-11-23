export function SetupNeeded() {
  return (
    <main className="center-page">
      <div className="empty" style={{ textAlign: "left", maxWidth: 620 }}>
        <h2>One step left: connect storage</h2>
        <p style={{ margin: "12px 0", maxWidth: "none" }}>
          LittleChrono keeps moments and photos in Vercel Blob. In your Vercel project, open <b>Storage</b>, create a{" "}
          <b>Blob</b> store, connect it to this project, then redeploy. No other setup is needed.
        </p>
      </div>
    </main>
  );
}
