import { Restaurant } from '../types';

export const SEED_RESTAURANTS: Restaurant[] = [
  {
    id: 'rest-1',
    name: '巷口老牌牛肉麵館',
    categories: ['拉麵米粉'],
    images: [
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80'
    ],
    coverIndex: 0,
    address: '台北市大安區新生南路二段2號（學校側門轉角）',
    businessHours: '11:00 開始營業',
    websiteUrl: 'https://www.facebook.com',
    googleMapsUrl: 'https://maps.app.goo.gl/JnftyPbAb1LjgAZqH',
    note: '週二公休，電話：02-2398-8888，用餐時間人很多建議提早 10 分鐘去',
    featuredDishId: 'dish-1-1',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    dishes: [
      {
        id: 'dish-1-1',
        name: '清燉牛肉細麵',
        opinion: 'like',
        note: '湯頭鮮甜、牛肉軟嫩好咬，小朋友每次都能把湯喝光！',
        photos: [
          'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80'
        ]
      },
      {
        id: 'dish-1-2',
        name: '香酥蔥油餅',
        opinion: 'like',
        note: '外皮脆脆的咬起來卡滋卡滋，可以沾點甜油膏'
      },
      {
        id: 'dish-1-3',
        name: '川味麻辣牛肉麵',
        opinion: 'dislike',
        note: '大人覺得香，但真的很辣！七歲小孩咬一口就狂喝水，千千萬萬別點給小孩！'
      },
      {
        id: 'dish-1-4',
        name: '涼拌小黃瓜',
        opinion: 'neutral',
        note: '酸甜開胃，普通'
      }
    ]
  },
  {
    id: 'rest-2',
    name: '卡滋卡滋日式炸豬排與咖哩',
    categories: ['日式便當'],
    images: [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80'
    ],
    coverIndex: 0,
    address: '台北市松山區民生東路三段120號2樓（有兒童餐椅）',
    businessHours: '11:30 - 21:00',
    websiteUrl: 'https://www.instagram.com',
    bookingUrl: 'https://inline.app/booking/-katsukatsu/reserve',
    googleMapsUrl: 'https://maps.app.goo.gl/JnftyPbAb1LjgAZqH',
    note: '白飯和味噌湯可以免費續加一次！電話：02-2712-3456',
    featuredDishId: 'dish-2-1',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    dishes: [
      {
        id: 'dish-2-1',
        name: '起司爆漿豬排定食',
        opinion: 'like',
        note: '起司拉絲超長好好玩！豬排外脆肉嫩，第一名推薦',
        photos: [
          'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=800&q=80'
        ]
      },
      {
        id: 'dish-2-2',
        name: '甜味蘋果日式咖哩蛋包飯',
        opinion: 'like',
        note: '甜甜的完全不辣，蛋皮滑滑嫩嫩的配飯超快吃光'
      },
      {
        id: 'dish-2-3',
        name: '辛口黑咖哩唐揚雞',
        opinion: 'dislike',
        note: '黑咖哩後勁很辛辣，小朋友吃了會哭，記得避開'
      }
    ]
  },
  {
    id: 'rest-3',
    name: '歡樂麥當當速食店',
    categories: ['漢堡薯條'],
    images: [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80'
    ],
    coverIndex: 0,
    address: '站前旗艦店（有得來速）',
    businessHours: '06:00 - 24:00',
    note: '週末有送兒童玩具，開車去外帶很方便',
    featuredDishId: 'dish-3-2',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    dishes: [
      {
        id: 'dish-3-1',
        name: '黃金麥克雞塊配糖醋醬',
        opinion: 'like',
        note: '每次必點 6 塊！外皮香脆，沾糖醋醬最對味'
      },
      {
        id: 'dish-3-2',
        name: '現炸金黃小薯條（備註去鹽）',
        opinion: 'like',
        note: '備註去鹽給小朋友吃更健康，而且現炸熱騰騰超脆'
      },
      {
        id: 'dish-3-3',
        name: '勁辣香雞翅',
        opinion: 'dislike',
        note: '非常辣！避雷，別不小心點給小孩吃'
      }
    ]
  },
  {
    id: 'rest-4',
    name: '阿滿師純手工水餃鍋貼專賣',
    categories: ['手工水餃'],
    images: [
      'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=800&q=80'
    ],
    coverIndex: 0,
    address: '傳統市場正門口旁',
    businessHours: '11:00 - 20:00',
    note: '現點現煎鍋貼要等約 8 分鐘',
    featuredDishId: 'dish-4-1',
    updatedAt: Date.now() - 1000 * 60 * 60 * 12,
    dishes: [
      {
        id: 'dish-4-1',
        name: '鮮甜高麗菜脆皮鍋貼',
        opinion: 'like',
        note: '底部冰花煎得超酥脆，內餡是脆甜高麗菜，一口氣能吃 8 顆'
      },
      {
        id: 'dish-4-2',
        name: '玉米香濃豬肉水餃',
        opinion: 'like',
        note: '每一顆都有甜甜的玉米粒，小朋友最愛'
      },
      {
        id: 'dish-4-3',
        name: '重口味韭菜水餃',
        opinion: 'dislike',
        note: '韭菜味道太衝，小朋友很排斥吐出來，避雷！'
      },
      {
        id: 'dish-4-4',
        name: '酸辣湯',
        opinion: 'dislike',
        note: '胡椒粉放很多很嗆辣，小孩喝不習慣'
      }
    ]
  },
  {
    id: 'rest-5',
    name: '陽光窯烤手工披薩與義大利麵',
    categories: ['窯烤披薩'],
    images: [
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
    ],
    coverIndex: 0,
    address: '台北市中正區公園路52號（二二八公園正對面）',
    businessHours: '11:30 - 21:30',
    websiteUrl: 'https://www.facebook.com',
    bookingUrl: 'https://inline.app/booking/-sunshinepizza/tables',
    googleMapsUrl: 'https://maps.app.goo.gl/JnftyPbAb1LjgAZqH',
    note: '吃完可以去對面公園溜滑梯！電話：02-2388-9900',
    updatedAt: Date.now() - 1000 * 60 * 60 * 5,
    dishes: [
      {
        id: 'dish-5-1',
        name: '夏威夷鳳梨火腿比薩',
        opinion: 'like',
        note: '甜酸鳳梨加厚厚起司，小孩的最愛'
      },
      {
        id: 'dish-5-2',
        name: '奶油培根蛋黃細圓麵',
        opinion: 'like',
        note: '奶香味濃郁，麵條Ｑ彈很有嚼勁'
      },
      {
        id: 'dish-5-3',
        name: '墨西哥辣牛肉披薩',
        opinion: 'dislike',
        note: '上面有綠色墨西哥辣椒，辣度破表避雷！'
      }
    ]
  }
];
