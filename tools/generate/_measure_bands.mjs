import sharp from 'sharp';

async function bands(path, label) {
  const img = sharp(path);
  const meta = await img.metadata();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;
  // sample a vertical strip at x=40 (left gutter — avoids centered content, catches band bg)
  const x = 40;
  const rows = [];
  for (let y = 0; y < H; y++) {
    const i = (y * W + x) * C;
    rows.push([data[i], data[i+1], data[i+2]]);
  }
  // classify each row into a coarse bucket
  function bucket([r,g,b]) {
    if (r>230 && g>230 && b>230) return 'white';
    if (Math.abs(r-122)<18 && Math.abs(g-122)<18 && Math.abs(b-122)<18) return 'grey';    // #7a7a7a bands
    if (r>235 && g>180 && g<210 && b<110) return 'gold-mut'; // #edc251 footer
    if (r>240 && g>170 && b<60) return 'gold';   // #f8bb1b
    if (Math.abs(r-122)<25 && g>140 && g<175 && Math.abs(b-125)<25) return 'green'; // testimonial
    if (r<110 && g<110 && b<110) return 'dark';  // photo/scrim
    return `other(${r},${g},${b})`;
  }
  let prev=null, start=0;
  const segs=[];
  for (let y=0;y<H;y++){
    const b=bucket(rows[y]);
    if(b!==prev){ if(prev!==null) segs.push([prev,start,y-1,y-start]); prev=b; start=y; }
  }
  segs.push([prev,start,H-1,H-start]);
  // only report segments taller than 20px
  console.log(`\n=== ${label} (H=${H}) ===`);
  for(const [b,s,e,h] of segs){ if(h>=20) console.log(`  ${String(s).padStart(4)}–${String(e).padStart(4)} (${String(h).padStart(4)}px) ${b}`); }
}

await bands(process.argv[2], 'REF');
await bands(process.argv[3], 'OURS');
