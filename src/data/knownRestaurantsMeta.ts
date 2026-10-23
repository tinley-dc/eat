import { Restaurant } from '../types';

/**
 * 系統已知店家之中繼資料對照表（營業時間、電話、官網、訂位、Google地圖）
 * 用於跨裝置初次開啟、試算表未及時回傳時之即時修復與兜底保護，確保任何裝置與 GitHub Pages 永不顯示空白
 */
export const KNOWN_RESTAURANTS_METADATA: Record<string, Partial<Restaurant>> = {
  // 示範店家
  'rest-1': {
    businessHours: '11:00 開始營業',
    websiteUrl: 'https://www.facebook.com',
    googleMapsUrl: 'https://maps.app.goo.gl/JnftyPbAb1LjgAZqH'
  },
  'rest-2': {
    businessHours: '11:30 - 21:00',
    websiteUrl: 'https://www.instagram.com',
    bookingUrl: 'https://inline.app/booking/-katsukatsu/reserve',
    googleMapsUrl: 'https://maps.app.goo.gl/JnftyPbAb1LjgAZqH'
  },
  'rest-3': {
    businessHours: '06:00 - 24:00'
  },
  'rest-4': {
    businessHours: '11:00 - 20:00'
  },
  'rest-5': {
    businessHours: '11:30 - 21:30',
    websiteUrl: 'https://www.facebook.com',
    bookingUrl: 'https://inline.app/booking/-sunshinepizza/tables',
    googleMapsUrl: 'https://maps.app.goo.gl/JnftyPbAb1LjgAZqH'
  },

  // 使用者自訂 31 間店家
  'rest-1792395457517': {
    name: '私嚐の吃飯',
    businessHours: '11:30 開始營業',
    address: '300新竹市東區中正里中正路96巷16號'
  },
  'rest-1792470030301': {
    name: '豪果複合式餐廳',
    businessHours: '11:00 開始營業',
    googleMapsUrl: 'https://www.google.com/maps/place/%E8%B1%AA%E6%9E%9C%E8%A4%87%E5%90%88%E5%BC%8F%E9%A4%90%E5%BB%B3/@24.8175441,120.9744683,17z/data=!3m1!4b1!4m6!3m5!1s0x346835cf0fcf35a5:0xde564be0cae75bf9!8m2!3d24.8175441!4d120.9744683!16s%2Fg%2F12m9mbgt9?entry=ttu&g_ep=EgoyMDI2MTAxNC4wIKXMDSoASAFQAw%3D%3D'
  },
  'rest-1792480062910': {
    name: '窯屋洋煨',
    businessHours: '10:00 開始營業',
    address: '300新竹市東區北大路21號',
    websiteUrl: 'https://www.instagram.com/yaowu_2025?igsh=MXI2em40MDJleWh5Yg==&utm_source=qr',
    bookingUrl: 'https://shop.ichefpos.com/store/YeMo7hJ8/ordering',
    googleMapsUrl: 'https://www.google.com/maps/place/%E7%AA%AF%E5%B1%8B%E6%B4%8B%E7%85%A8%EF%BC%88%E5%AE%9A%E9%A3%9F%E3%80%81%E6%97%A9%E5%8D%88%E9%A4%90%E3%80%81%E5%88%BA%E8%BA%AB%E3%80%81%E5%A3%BD%E5%8F%B8%EF%BC%89/@24.8130333,120.9738851,17z/data=!3m1!4b1!4m6!3m5!1s0x34683500230b3e61:0xe32707749c70b1de!8m2!3d24.8130333!4d120.9738851!16s%2Fg%2F11mcjb9hlv?entry=ttu&g_ep=EgoyMDI2MTAxNC4wIKXMDSoASAFQAw%3D%3D'
  },
  'rest-1792481775100': {
    name: '三番日式食堂',
    businessHours: '11:00 開始營業',
    address: '300新竹市北區光華里湳雅街42-1號'
  },
  'rest-1792483000106': {
    name: '八方雲集',
    businessHours: '11:00 開始營業',
    address: '300新竹市北區水田里中正路346號',
    websiteUrl: 'https://www.8way.com.tw/',
    googleMapsUrl: 'https://www.google.com/maps/place/%E5%85%AB%E6%96%B9%E9%9B%B2%E9%9B%86-%E6%96%B0%E7%AB%B9%E4%B8%AD%E6%AD%A3%E5%BA%97/@24.8139132,120.9630934,17z/data=!3m1!4b1!4m6!3m5!1s0x346835ce5a856d85:0xf91c4dc0b9b05af0!8m2!3d24.8139132!4d120.9630934!16s%2Fg%2F1hm3md1v8?entry=ttu&g_ep=EgoyMDI2MTAxNC4wIKXMDSoASAFQAw%3D%3D'
  },
  'rest-1792489340496': {
    name: '香香香烤鴨',
    businessHours: '16:00 開始營業',
    address: '300新竹市北區光華里光華北街6號300',
    googleMapsUrl: 'https://www.google.com/maps/place/%E9%A6%99%E9%A6%99%E9%A6%99%E7%83%A4%E9%B4%A8/@24.8179307,120.9741231,17z/data=!3m1!4b1!4m6!3m5!1s0x346835ce81492b7b:0xf8d3848b41123d35!8m2!3d24.8179307!4d120.9741231!16s%2Fg%2F11h75r9qrg?entry=ttu&g_ep=EgoyMDI2MTAxOS4wIKXMDSoASAFQAw%3D%3D'
  },
  'rest-1792489373507': {
    name: '野菜園滷味',
    businessHours: '17:30 開始營業',
    address: '30012新竹市北區金華里光華二街26號',
    websiteUrl: 'https://www.facebook.com/share/g/1NutBhf9y3/?mibextid=wwXIfr',
    googleMapsUrl: 'https://www.google.com/maps/place/%E9%87%8E%E8%8F%9C%E5%9C%92%E6%BB%B7%E5%91%B3-%E6%96%B0%E7%AB%B9%E5%BA%97/@24.8176863,120.9745177,17z/data=!3m1!4b1!4m6!3m5!1s0x3468350b5d71afeb:0x9df050ea3371448e!8m2!3d24.8176863!4d120.9745177!16s%2Fg%2F11fl8t6yxs?entry=ttu&g_ep=EgoyMDI2MTAxOS4wIKXMDSoASAFQAw%3D%3D'
  },
  'rest-1792642040924': {
    name: '阿明滷肉飯',
    businessHours: '07:00 開始營業',
    address: '300新竹市北區光華里光華街110-1號'
  },
  'rest-1792642460429': {
    name: '勝利鴨鴨肉麵',
    businessHours: '11:00 開始營業',
    address: '300新竹市北區金華里光華南街46號',
    phone: '035155888',
    websiteUrl: 'https://www.facebook.com/profile.php?id=61571838535040&locale=zh_TW'
  },
  'rest-1792642809848': {
    name: '榮記客家湯圓',
    businessHours: '08:30 開始營業',
    address: '300新竹市東區成功里武昌街64號'
  },
  'rest-1792643196497': {
    name: '麥當勞',
    businessHours: '06:00 開始營業'
  },
  'rest-1792643230430': {
    name: '肯德基',
    businessHours: '10:00 開始營業'
  },
  'rest-1792643399573': {
    name: '必勝客',
    businessHours: '11:00 開始營業'
  },
  'rest-1792643992186': {
    name: '摩斯漢堡',
    businessHours: '06:00 開始營業'
  },
  'rest-1792652764509': {
    name: '靜岡勝政日式豬排',
    businessHours: '11:00 開始營業',
    address: '300新竹市東區復中里中央路229號5樓',
    websiteUrl: 'https://www.mulino.tw/tw/brand/katsumasa'
  },
  'rest-1792653038278': {
    name: '大戶屋',
    businessHours: '11:00 開始營業',
    address: '300194新竹市東區復中里中央路229號3樓',
    websiteUrl: 'https://www.ootoya.com.tw/'
  },
  'rest-1792653417011': {
    name: '京都勝牛',
    businessHours: '11:00 開始營業',
    address: '30041新竹市東區復中里中央路229號7樓',
    websiteUrl: 'http://kyoto-katsugyu.com.tw/',
    googleMapsUrl: 'https://www.google.com/maps/place/%E4%BA%AC%E9%83%BD%E5%8B%9D%E7%89%9B-%E6%96%B0%E7%AB%B9%E5%B7%A8%E5%9F%8E%E5%BA%97/data=!4m2!3m1!1s0x0:0x6a788faf3456ff6e?sa=X&ved=1t:2428&ictx=111'
  },
  'rest-1792653867246': {
    name: '車站肉羹麵',
    businessHours: '09:00 開始營業',
    address: '300新竹市東區榮光里大同路4號'
  },
  'rest-1792654225470': {
    name: '桃園牛排',
    businessHours: '10:30 開始營業',
    address: '300新竹市東區中正里中正路46號',
    googleMapsUrl: 'https://www.google.com/maps/place/%E6%A1%83%E5%9C%92%E7%89%9B%E6%8E%92/data=!4m2!3m1!1s0x0:0xdf37e2e2e859855d?sa=X&ved=1t:2428&ictx=111'
  },
  'rest-1792655248901': {
    name: 'Mr.steak史堤克',
    businessHours: '11:30 開始營業',
    address: '300新竹市東區榮光里林森路2巷9號2樓',
    websiteUrl: 'https://www.mrsteak.com.tw/',
    googleMapsUrl: 'https://www.google.com/maps/place/Mr.steak%E5%8F%B2%E5%A0%A4%E5%85%8B%E7%89%9B%E6%8E%92%E6%96%B0%E7%AB%B9%E5%BA%97/data=!4m2!3m1!1s0x0:0xe86305def1949893?sa=X&ved=1t:2428&ictx=111'
  },
  'rest-1792661520067': {
    name: '乾家肉粽粿粽大王',
    businessHours: '09:00 開始營業',
    address: '300新竹市北區中央里中山路97號',
    websiteUrl: 'http://www.b476359.url.tw/',
    googleMapsUrl: 'https://www.google.com/maps/place/%E4%B9%BE%E5%AE%B6%E8%82%89%E7%B2%BD%E7%B2%BF%E7%B2%BD%E5%A4%A7%E7%8E%8B/data=!4m2!3m1!1s0x346835c0014e1849:0x96dae0b4abe9a88d?sa=X&ved=1t:242&ictx=111'
  },
  'rest-1792661949057': {
    name: '帝王食補薑母鴨',
    businessHours: '16:00 開始營業',
    address: '300新竹市東區文華里北大路42號',
    phone: '035153572',
    websiteUrl: 'http://www.tain.com.tw/',
    googleMapsUrl: 'https://www.google.com/maps/place/%E5%B8%9D%E7%8E%8B%E9%A3%9F%E8%A3%9C%E8%96%91%E6%AF%8D%E9%B4%A8'
  },
  'rest-1792662093324': {
    name: '成大器烤肉飯',
    businessHours: '10:30 開始營業',
    address: '300新竹市東區北大路36號',
    phone: '035458968',
    googleMapsUrl: 'https://www.google.com/maps/place/%E6%88%90%E5%A4%A7%E5%99%A8%E7%83%A4%E8%82%89%E9%A3%AF'
  },
  'rest-1792669432083': {
    name: 'NU PASTA',
    businessHours: '11:00 開始營業',
    address: '300新竹市北區光華里光華街86號',
    phone: '035333780',
    websiteUrl: 'https://www.facebook.com/nupastalight/',
    bookingUrl: 'https://order.nidin.shop/menu/15607',
    googleMapsUrl: 'https://www.google.com/maps/place/NU'
  },
  'rest-1792682701633': {
    name: 'JAI宅',
    businessHours: '11:00 開始營業',
    address: '300新竹市東區復中里民權路195號',
    phone: '035439988',
    websiteUrl: 'https://www.zunhongtw.com/',
    bookingUrl: 'https://inline.app/booking/-MRz-0f5qNkB6q-cZvur:inline-live-2/-MyqKNlxxJ3RlWnQev-P',
    googleMapsUrl: 'https://www.google.com/maps/place/JAI%E5%AE%85'
  },
  'rest-1792717502733': {
    name: '拼什鍋',
    businessHours: '11:00 開始營業',
    address: '300新竹市東區復興里田美三街1號',
    phone: '035351685',
    googleMapsUrl: 'https://www.google.com/maps/place/%E6%8B%BC%E4%BB%80%E9%8D%8B'
  },
  'rest-1792718061742': {
    name: '甘泉魚麵',
    businessHours: '11:00 開始營業',
    address: '300新竹市北區光華里光華北街56號',
    phone: '035428485',
    websiteUrl: 'https://instagram.com/huangkai012?r=nametag'
  },
  'rest-1792718514723': {
    name: '原宿廚房',
    businessHours: '11:00 開始營業',
    address: '300新竹市東區復中里中央路229號300 新竹市東區中央路229號4樓'
  },
  'rest-1792719113269': {
    name: '韓姜熙의小廚房',
    businessHours: '11:00 開始營業',
    address: '300新竹市東區復中里中央路229號4 樓',
    websiteUrl: 'https://www.mapoking.com.tw/MenuO/StoreInfoD.html'
  },
  'rest-1792719791888': {
    name: '福砌阿華什錦麵',
    businessHours: '07:00 開始營業',
    address: '300新竹市東區復興里自由路95巷38弄24號'
  },
  'rest-1792720511890': {
    name: '大埔鐵板燒',
    businessHours: '11:00 開始營業',
    address: '300新竹市東區復中里民生路172號',
    phone: '035152583'
  }
};

export const KNOWN_RESTAURANTS_BY_NAME: Record<string, Partial<Restaurant>> = {};

Object.values(KNOWN_RESTAURANTS_METADATA).forEach((meta) => {
  if (meta.name) {
    KNOWN_RESTAURANTS_BY_NAME[meta.name.trim()] = meta;
  }
});

/**
 * 查詢已知店家中繼資料（優先比對 ID，次之比對店家名稱）
 */
export function getKnownRestaurantMeta(id?: string, name?: string): Partial<Restaurant> | undefined {
  if (id && KNOWN_RESTAURANTS_METADATA[id]) {
    return KNOWN_RESTAURANTS_METADATA[id];
  }
  if (name && KNOWN_RESTAURANTS_BY_NAME[name.trim()]) {
    return KNOWN_RESTAURANTS_BY_NAME[name.trim()];
  }
  return undefined;
}
