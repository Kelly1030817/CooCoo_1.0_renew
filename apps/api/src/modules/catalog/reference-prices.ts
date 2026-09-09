import type { IngredientPrice } from '@coocoo/contracts';
import type { CatalogRepository } from './repository';

// Verified against the linked Carrefour Taiwan pages on 2026-09-08. Owner edits
// take precedence; observations become stale automatically after 30 days.
const observedAt='2026-09-08T09:35:00+08:00';
const source=(path:string)=>`https://online.carrefour.com.tw${path}`;
const price=(id:string,ingredientKey:string,name:string,packageQuantity:number,unit:string,amount:number,path:string):IngredientPrice=>({id,ingredientKey,name,packageQuantity,unit,price:amount,source:source(path),observedAt});

export const starterReferencePrices:IngredientPrice[]=[
  price('d1111111-1111-4111-8111-111111111111','雞肉','產銷履歷全氣冷雞冷藏雞胸肉 300g',300,'克',90,'/zh/%E9%87%91%E8%B1%90%E7%9B%9B/2432000700101.html'),
  price('d2222222-2222-4222-8222-222222222222','烏龍麵','讚岐冷凍烏龍麵 600g',1,'包',99,'/zh/%E5%8D%97%E5%83%91/1522202500101.html'),
  price('c0000000-0000-4000-8000-000000000003','蛋','UNIDESIGN 非籠飼平飼新鮮蛋 10入',10,'顆',119,'/zh/1507007100101.html'),
  price('c0000000-0000-4000-8000-000000000004','豆腐','義美傳統料理豆腐 300g',300,'克',21,'/zh/%E7%BE%A9%E7%BE%8E/1508000300101.html'),
  price('c0000000-0000-4000-8000-000000000005','豬肉','立大食品冷凍台灣豬後腿肉絲 250g',250,'克',120,'/zh/%E7%AB%8B%E5%A4%A7%E9%A3%9F%E5%93%81/2410093500101.html'),
  price('c0000000-0000-4000-8000-000000000006','洋蔥','紐西蘭洋蔥 1kg',1,'公斤',69,'/zh/2201002300101.html'),
  price('c0000000-0000-4000-8000-000000000007','番茄','履歷牛番茄 500g',500,'克',125,'/zh/2202103200101.html'),
  price('c0000000-0000-4000-8000-000000000008','白米','關山穀堡壽豐七星米 3kg',3,'公斤',199,'/zh/%E9%97%9C%E5%B1%B1%E7%A9%80%E5%A0%A1/1451012200101.html'),
  price('c0000000-0000-4000-8000-000000000009','麵條','好勁道家常麵條 300g',300,'克',24,'/zh/%E7%B5%B1%E4%B8%80/1450606500101.html'),
  price('c0000000-0000-4000-8000-000000000010','油','統一大豆沙拉油 760ml',760,'毫升',79,'/zh/%E7%B5%B1%E4%B8%80/1461000100101.html'),
  price('c0000000-0000-4000-8000-000000000011','醬油','龜甲萬甘醇醬油 500cc',500,'毫升',59,'/zh/%E7%B5%B1%E4%B8%80/1462001900101.html'),
  price('c0000000-0000-4000-8000-000000000012','味噌','十全原味味噌 500g',500,'克',57,'/zh/1514002000101.html'),
  price('c0000000-0000-4000-8000-000000000013','胡麻醬','陶板屋香濃原粒胡麻醬 200ml',200,'毫升',95,'/zh/%E9%99%B6%E6%9D%BF%E5%B1%8B/1463208900101.html'),
  price('c0000000-0000-4000-8000-000000000014','紅蘿蔔','有機一番蔘胡蘿蔔 500g',500,'克',50,'/zh/2201009900101.html'),
  price('c0000000-0000-4000-8000-000000000015','金針菇','有機金針菇約 200g',200,'克',15,'/zh/2204027700101.html'),
  price('c0000000-0000-4000-8000-000000000016','青蔥','有機青蔥 150g',150,'克',39,'/zh/2203102400401.html'),
  price('c0000000-0000-4000-8000-000000000017','馬鈴薯','履歷熟成馬鈴薯 200g',200,'克',60,'/zh/2201000400101.html'),
  price('c0000000-0000-4000-8000-000000000018','地瓜','達人上菜台農57號冰烤地瓜 500g',500,'克',129,'/zh/%E9%81%94%E4%BA%BA%E4%B8%8A%E8%8F%9C/1527108100101.html'),
  price('c0000000-0000-4000-8000-000000000019','鮪魚','同榮水煮鮪魚 180g × 3罐',540,'克',109,'/zh/%E5%90%8C%E6%A6%AE/1483004000103.html'),
  price('c0000000-0000-4000-8000-000000000020','牛奶','義美牛乳 125ml × 6',750,'毫升',75,'/zh/%E7%BE%A9%E7%BE%8E/1502091000101.html'),
  price('c0000000-0000-4000-8000-000000000021','雞腿肉','安心雞去骨清腿 190g',190,'克',88,'/zh/2432006200101.html'),
  price('c0000000-0000-4000-8000-000000000022','牛肉','冷凍美國菲瑞霜降牛肉火鍋片 250g',250,'克',259,'/zh/2460101800101.html'),
  price('c0000000-0000-4000-8000-000000000023','青花菜','冷凍青花菜 1kg',1,'公斤',109,'/zh/1527108600101.html'),
  price('c0000000-0000-4000-8000-000000000024','玉米粒','牛頭牌金鑽玉米粒 185g × 3罐',555,'克',83,'/zh/%E7%89%9B%E9%A0%AD%E7%89%8C/1481002300103.html'),
  price('c0000000-0000-4000-8000-000000000025','蒜頭','手剝鮮蒜仁 120g',120,'克',99,'/zh/2203000900501.html'),
];

export async function ensureStarterReferencePrices(repo:CatalogRepository){
  const rows=starterReferencePrices.map(item=>({id:item.id,data:item,updated_at:item.observedAt}));
  const result=await repo.db.from('recipe_reference_prices').upsert(rows,{onConflict:'id',ignoreDuplicates:true});
  if(result.error)throw result.error;
}
