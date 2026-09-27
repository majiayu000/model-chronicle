// Native SVG is created only after the template has resolved its data.
(function () {
  window.ChroniclePriceChart = function ({ history = [] }) {
    const h = window.React.createElement;
    if (!history.length) return null;
    const max = Math.max(
      1,
      ...history.flatMap((p) => [p.input_per_mtok, p.output_per_mtok]),
    );
    const x = (i) =>
      history.length === 1 ? 200 : 24 + (i * 352) / (history.length - 1);
    const y = (price) => 130 - (price / max) * 110;
    const series = [
      ["input_per_mtok", "#5ad1c8"],
      ["output_per_mtok", "#d4f53c"],
    ];
    return h(
      "svg",
      {
        viewBox: "0 0 400 150",
        role: "img",
        "aria-label": "输入和输出价格随观测日期变化",
        style: {
          display: "block",
          width: "100%",
          minWidth: 280,
          maxHeight: 180,
        },
      },
      ...series.flatMap(([key, color]) => [
        h("path", {
          key,
          d: history
            .map(
              (p, i) =>
                `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`,
            )
            .join(" "),
          fill: "none",
          stroke: color,
          strokeWidth: 2,
        }),
        ...history.map((p, i) =>
          h("circle", {
            key: `${key}-${i}`,
            cx: x(i),
            cy: y(p[key]),
            r: 4,
            fill: color,
          }),
        ),
      ]),
    );
  };
})();
