import type { Block } from "../data/templates";

export function Sheet({ blocks }: { blocks: Block[] }) {
  return (
    <div className="sheet-wrap overflow-x-auto pb-2">
      <div className="sheet mx-auto">
        {blocks.map((b, i) => (
          <BlockView key={i} b={b} />
        ))}
      </div>
    </div>
  );
}

const pre = { whiteSpace: "pre-wrap" } as const;

function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case "org":
      return (
        <div className="text-center font-bold" style={pre}>
          {b.text}
        </div>
      );
    case "meta":
      return (
        <div className="flex justify-between mt-2">
          <span>{b.a}</span>
          <span>{b.b}</span>
        </div>
      );
    case "title":
      return (
        <div className="text-center font-bold mt-5" style={{ ...pre, letterSpacing: "0.08em" }}>
          {b.text}
        </div>
      );
    case "sub":
      return (
        <div className="text-center font-bold mb-4" style={pre}>
          {b.text}
        </div>
      );
    case "p":
      return (
        <div className="text-justify" style={{ ...pre, textIndent: "1.25cm" }}>
          {b.text}
        </div>
      );
    case "li":
      return (
        <div className="text-justify" style={{ ...pre, textIndent: "1.25cm" }}>
          {b.text}
        </div>
      );
    case "plain":
      return (
        <div className="text-justify" style={pre}>
          {b.text}
        </div>
      );
    case "right":
      return (
        <div style={{ ...pre, marginLeft: "50%" }}>{b.text}</div>
      );
    case "h":
      return (
        <div className="text-center font-bold mt-2" style={pre}>
          {b.text}
        </div>
      );
    case "small":
      return (
        <div className="text-justify mb-2" style={{ ...pre, fontSize: "12pt", textIndent: "1.25cm" }}>
          {b.text}
        </div>
      );
    case "sig":
      return (
        <div className="flex justify-between items-end gap-6 mt-4 keep">
          <div style={pre}>{b.a}</div>
          <div className="text-right" style={pre}>
            {b.b}
          </div>
        </div>
      );
    case "gap":
      return <div style={{ height: "0.8em" }} />;
    default:
      return null;
  }
}
