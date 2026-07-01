import { ImageResponse } from "next/og";

function PwaIcon({ size }: { size: number }) {
  const radius = Math.round(size * 0.2);
  const inner = Math.round(size * 0.44);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0d9488",
        borderRadius: radius,
      }}
    >
      <div
        style={{
          width: inner,
          height: inner,
          background: "white",
          borderRadius: inner / 2,
        }}
      />
    </div>
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeParam } = await params;
  const size = Number(sizeParam);

  if (![192, 512].includes(size)) {
    return new Response("Not found", { status: 404 });
  }

  return new ImageResponse(<PwaIcon size={size} />, {
    width: size,
    height: size,
  });
}
