export function Lede() {
  return (
    <div className="my-8 max-w-[760px]">
      <h1 className="font-disp text-[clamp(32px,4.6vw,56px)] font-bold leading-[1.03] tracking-[-1.4px]">
        A machine obeyed its rules.
        <br />
        Prove it <span className="text-acid">without revealing the rules or the action.</span>
      </h1>
      <p className="mt-3.5 text-[16.5px] text-muted">
        An autonomous agent acts under an <b className="text-white">encrypted</b> authority. The contract checks{" "}
        <span className="text-acid">action ≤ authority</span> on ciphertext, anchors a public proof on Arbitrum,
        and only the operator can unseal the numbers. Anchoring is table stakes - the confidentiality is the moat.
      </p>
    </div>
  );
}
