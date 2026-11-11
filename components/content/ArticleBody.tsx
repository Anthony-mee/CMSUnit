import type { ReactNode } from "react";

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (link) {
      return <a href={link[2]} key={index} rel="noreferrer" target="_blank">{link[1]}</a>;
    }
    return part;
  });
}

function renderImage(line: string, key: number) {
  const image = line.match(/^!\[([^\]]+)\]\((https:\/\/images\.unsplash\.com\/[^\s)]+)\)$/);
  if (!image) return null;

  return (
    <figure className="content-reader-figure" key={key}>
      <img alt={image[1]} loading="lazy" src={image[2]} />
      <figcaption>
        {image[1]} · Photo from{" "}
        <a href="https://unsplash.com/license" rel="noreferrer" target="_blank">Unsplash</a>
      </figcaption>
    </figure>
  );
}

const roboflowTutorials = new Set([
  "https://media.roboflow.com/quickstart/step1.mp4",
  "https://media.roboflow.com/quickstart/step2.mp4",
  "https://media.roboflow.com/quickstart/step3-autolabel.mp4",
  "https://media.roboflow.com/quickstart/step4-verify-labelassist.mp4",
  "https://media.roboflow.com/quickstart/step5-version-training.mp4",
  "https://media.roboflow.com/quickstart/step6-deploy.mp4",
]);

const youtubeTutorials = new Set([
  "ntaXWS8Lk34",
  "VeWBYRpodnI",
  "fTEFEwJxO88",
  "SdR2TXewC_o",
  "6pd9R6avqxs",
  "LMp-0HAuI68",
]);

function renderVideo(line: string, key: number) {
  const video = line.match(/^@\[video:([^\]]+)\]\((https:\/\/media\.roboflow\.com\/quickstart\/[a-z0-9-]+\.mp4)\)$/);
  if (video && roboflowTutorials.has(video[2])) {
    return (
      <figure className="content-reader-video" key={key}>
        <video controls preload="metadata" playsInline>
          <source src={video[2]} type="video/mp4" />
          Your browser does not support inline video playback.
        </video>
        <figcaption>{video[1]} · Official Roboflow tutorial</figcaption>
      </figure>
    );
  }

  const youtube = line.match(/^@\[youtube:([^\]]+)\]\(https:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})\)$/);
  if (!youtube || !youtubeTutorials.has(youtube[2])) return null;

  return (
    <figure className="content-reader-video" key={key}>
      <iframe
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        src={`https://www.youtube-nocookie.com/embed/${youtube[2]}`}
        title={youtube[1]}
      />
      <figcaption>{youtube[1]} · YouTube video, embedded for playback here</figcaption>
    </figure>
  );
}

export default function ArticleBody({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let code: string[] = [];
  let table: string[] = [];
  let inCode = false;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(<p key={`p-${blocks.length}`}>{renderInline(paragraph.join(" "))}</p>);
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length || !listType) return;
    const List = listType;
    blocks.push(
      <List key={`list-${blocks.length}`}>
        {list.map((item, index) => <li key={index}>{renderInline(item)}</li>)}
      </List>,
    );
    list = [];
    listType = null;
  };
  const flushTable = () => {
    if (!table.length) return;
    const rows = table.map((row) =>
      row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim()),
    );
    const hasSeparator = rows.length > 1 && rows[1].every((cell) => /^:?-{3,}:?$/.test(cell));
    const headings = hasSeparator ? rows[0] : [];
    const bodyRows = rows.slice(hasSeparator ? 2 : 1);
    blocks.push(
      <div className="content-reader-table-wrap" key={`table-${blocks.length}`}>
        <table>
          {headings.length > 0 && (
            <thead><tr>{headings.map((cell, index) => <th key={index}>{renderInline(cell)}</th>)}</tr></thead>
          )}
          <tbody>
            {(headings.length > 0 ? bodyRows : rows).map((row, rowIndex) => (
              <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{renderInline(cell)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>,
    );
    table = [];
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      flushParagraph();
      flushList();
      flushTable();
      if (inCode) {
        blocks.push(<pre key={`code-${blocks.length}`}><code>{code.join("\n")}</code></pre>);
        code = [];
      }
      inCode = !inCode;
      return;
    }
    if (inCode) {
      code.push(line);
      return;
    }
    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushParagraph();
      flushList();
      table.push(trimmed);
      return;
    }

    flushTable();
    const image = renderImage(trimmed, blocks.length);
    if (image) {
      flushParagraph();
      flushList();
      flushTable();
      blocks.push(image);
      return;
    }

    const video = renderVideo(trimmed, blocks.length);
    if (video) {
      flushParagraph();
      flushList();
      blocks.push(video);
      return;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushTable();
      flushList();
      if (heading[1].length === 1 && blocks.length === 0) return;
      const Heading = heading[1].length < 3 ? "h2" : "h3";
      blocks.push(<Heading key={`h-${blocks.length}`}>{renderInline(heading[2])}</Heading>);
      return;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (bullet || numbered) {
      flushParagraph();
      const nextType = bullet ? "ul" : "ol";
      flushTable();
      if (listType && listType !== nextType) flushList();
      listType = nextType;
      list.push((bullet || numbered)![1]);
      return;
    }

    flushList();
    paragraph.push(trimmed);
  });

  flushParagraph();
  flushList();
  flushTable();
  if (inCode && code.length) {
    blocks.push(<pre key={`code-${blocks.length}`}><code>{code.join("\n")}</code></pre>);
  }

  return <div className="content-reader-body">{blocks}</div>;
}
