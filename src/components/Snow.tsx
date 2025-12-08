const Snow = () => {
  const flakes = Array.from({ length: 50 });

  return (
    <div
      className="
        pointer-events-none 
        fixed inset-0 
        overflow-hidden 
        z-[9999]
        hidden christmas:block
      "
    >
      {flakes.map((_, i) => (
        <div key={i} className="snowflake" style={{ ["--i" as any]: i }}>
          ❄
        </div>
      ))}
    </div>
  );
};

export default Snow;
