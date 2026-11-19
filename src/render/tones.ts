// Visual tone presets ("โทน"). Render-only; used by the game (?tone=) and by the tone-study renderer.
export interface Tone {
  id: string; nameTh: string; nameEn: string; noteTh: string;
  fog: number; fogNear: number; fogFar: number;
  hemiSky: number; hemiGround: number; hemiI: number; sun: number; sunI: number; exposure?: number;
  grassA: number; grassB: number; path: number; pathEdge: number; rune: number;
  treeMix: string[];
}

export const DEFAULT_TONE: Tone = {
  id: 'dewlight', nameTh: 'น้ำค้างยามเช้า', nameEn: 'Dewlight Morning', noteTh: 'สดใส เขียวสด คริสตัลฟ้า แดดอุ่น เป็นโทนหลักของด่านแรก',
  fog: 0xbfe6f2, fogNear: 22, fogFar: 60, hemiSky: 0xdff3ff, hemiGround: 0x86b86c, hemiI: 1.7, sun: 0xfff0d2, sunI: 2.1,
  grassA: 0x86c95f, grassB: 0x6fb85a, path: 0xead1a4, pathEdge: 0xc9a77a, rune: 0x5cf2e6, treeMix: ['tree_round', 'tree_round', 'tree_pine', 'tree_round_b'],
};

export const TONES: Tone[] = [
  DEFAULT_TONE,
  { id: 'blossom', nameTh: 'กลีบบุปผาล่องลม', nameEn: 'Blossom Drift', noteTh: 'ต้นไม้ชมพู ทางเดินลาเวนเดอร์ แสงนุ่ม เหมาะกับเมืองริมน้ำ',
    fog: 0xf3d9ec, fogNear: 20, fogFar: 55, hemiSky: 0xffe6f4, hemiGround: 0x9fb87e, hemiI: 1.75, sun: 0xffe3ee, sunI: 1.9,
    grassA: 0x9ccf74, grassB: 0x8cc46d, path: 0xe6d3ea, pathEdge: 0xbca0c4, rune: 0xff9ec7, treeMix: ['tree_round_b', 'tree_round_b', 'tree_round'] },
  { id: 'amber', nameTh: 'ตลาดอำพัน', nameEn: 'Amber Market', noteTh: 'แสงตะเกียงทองอุ่น ไม้และหินสีอิฐ ให้ความรู้สึกปลอดภัยของเมืองและร้านค้า',
    fog: 0xf2d6a8, fogNear: 18, fogFar: 50, hemiSky: 0xffe2b0, hemiGround: 0x9a7c55, hemiI: 1.5, sun: 0xffc46b, sunI: 2.4, exposure: 1.0,
    grassA: 0xa8bf62, grassB: 0x97b35a, path: 0xd9b48a, pathEdge: 0xa9825c, rune: 0xffc857, treeMix: ['tree_round', 'tree_round_b'] },
  { id: 'prism', nameTh: 'เที่ยงปริซึม', nameEn: 'Prism Noon', noteTh: 'อิ่มสีสูงสุด แสงจ้า คริสตัลเด่น สดใสที่สุดแต่ต้องระวังไม่ให้แย่งสายตาจากวงเตือน',
    fog: 0xd4f1ff, fogNear: 26, fogFar: 70, hemiSky: 0xf2fbff, hemiGround: 0x7fcf7a, hemiI: 1.9, sun: 0xffffff, sunI: 2.4, exposure: 1.1,
    grassA: 0x7fd36a, grassB: 0x68c463, path: 0xf2e2c2, pathEdge: 0xcdb48c, rune: 0xa78bfa, treeMix: ['tree_round', 'tree_pine', 'tree_round_b'] },
  { id: 'dusk', nameTh: 'สนธยาลมกระซิบ', nameEn: 'Hushwind Dusk', noteTh: 'ฟ้าส้มอมม่วง แสงเฉียงต่ำ เงายาว ให้อารมณ์การเดินทางกลับบ้าน',
    fog: 0xe9b7a3, fogNear: 18, fogFar: 52, hemiSky: 0xffc7a8, hemiGround: 0x6b6a8a, hemiI: 1.35, sun: 0xff9a5c, sunI: 2.3, exposure: 1.0,
    grassA: 0x7aa25c, grassB: 0x6b9256, path: 0xe0b58f, pathEdge: 0xa97e66, rune: 0xffc857, treeMix: ['tree_round', 'tree_pine'] },
  { id: 'moonpetal', nameTh: 'ราตรีกลีบจันทร์', nameEn: 'Moonpetal Night', noteTh: 'กลางคืนสีน้ำเงิน เห็ดและคริสตัลเรืองแสงนำทาง ใช้กับพื้นที่ลึกลับ',
    fog: 0x283a66, fogNear: 14, fogFar: 42, hemiSky: 0x8fa6ff, hemiGround: 0x2b3a4f, hemiI: 1.25, sun: 0xb7c8ff, sunI: 0.9, exposure: 1.15,
    grassA: 0x2f5a52, grassB: 0x284d4a, path: 0x7d86a8, pathEdge: 0x55607f, rune: 0x5cf2e6, treeMix: ['tree_pine', 'tree_round'] },
  { id: 'mistvale', nameTh: 'ซากหุบหมอก', nameEn: 'Mistvale Ruins', noteTh: 'หมอกเขียวอมฟ้า หินโบราณ อักขระเรือง สีลดลงเพื่อให้ของสำคัญเด่น',
    fog: 0x9fc4c0, fogNear: 10, fogFar: 36, hemiSky: 0xd2ece8, hemiGround: 0x5f7a6e, hemiI: 1.45, sun: 0xe4f2ea, sunI: 1.2,
    grassA: 0x6e9a7a, grassB: 0x628d72, path: 0xbcb6a6, pathEdge: 0x8c8678, rune: 0x5cf2e6, treeMix: ['tree_pine', 'tree_pine', 'tree_round'] },
  { id: 'stormglass', nameTh: 'ลานแก้วพายุ', nameEn: 'Stormglass Arena', noteTh: 'พื้นหินเทาม่วงเข้ม แสงฟ้าเย็น ทำให้วงเตือนสีส้มแดงเด่นที่สุด เหมาะกับลานบอส',
    fog: 0x4b4a6e, fogNear: 16, fogFar: 46, hemiSky: 0xb3b8ff, hemiGround: 0x3d3b52, hemiI: 1.4, sun: 0xd7dcff, sunI: 1.6,
    grassA: 0x4f6b5e, grassB: 0x465f56, path: 0x8f8aa6, pathEdge: 0x66617e, rune: 0xa78bfa, treeMix: ['tree_pine'] },
  { id: 'frostchime', nameTh: 'ทุ่งระฆังน้ำแข็ง', nameEn: 'Frostchime Glade', noteTh: 'หิมะขาวอมฟ้า คริสตัลซีด แสงสะอาด ต้องเพิ่มเส้นขอบตัวละครเพราะพื้นสว่างมาก',
    fog: 0xe3f0fb, fogNear: 20, fogFar: 56, hemiSky: 0xf4fbff, hemiGround: 0xaebfd2, hemiI: 1.6, sun: 0xffffff, sunI: 1.8, exposure: 0.95,
    grassA: 0xdfe9f2, grassB: 0xcfdde9, path: 0xb7c6d8, pathEdge: 0x93a6bd, rune: 0x5cf2e6, treeMix: ['tree_pine', 'tree_pine', 'tree_round'] },
  { id: 'verdant', nameTh: 'ป่าลึกมรกต', nameEn: 'Verdant Deep', noteTh: 'ป่าทึบเขียวเข้ม แสงลอดใบ หิ่งห้อย ให้ความรู้สึกผจญภัยระหว่างเส้นทาง',
    fog: 0x7fae86, fogNear: 14, fogFar: 40, hemiSky: 0xd7f7c9, hemiGround: 0x3c5c3c, hemiI: 1.5, sun: 0xfff2b0, sunI: 1.9,
    grassA: 0x4f9450, grassB: 0x468749, path: 0xc9b07f, pathEdge: 0x93805c, rune: 0xffc857, treeMix: ['tree_round', 'tree_pine', 'tree_pine'] },
];

export function toneById(id: string | null): Tone { return TONES.find((t) => t.id === id) ?? DEFAULT_TONE; }
