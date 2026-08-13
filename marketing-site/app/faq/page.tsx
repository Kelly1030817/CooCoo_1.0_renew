import type { Metadata } from 'next';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: '常見問題 FAQ | CooCoo煮煮',
  description: '關於都市單身套房租屋族自煮的常見問題解答。',
};

const faqs = [
  {
    question: '我只有一個快煮鍋，也能自煮嗎？',
    answer: '絕對可以！CooCoo煮煮的食譜大多專為快煮鍋與單口電磁爐設計，一鍋到底，不需要複雜的廚具也能變出美味料理。'
  },
  {
    question: '下班已經很累了，還有時間煮飯嗎？',
    answer: '我們的核心是「15分鐘快速上桌」。透過週末預先分裝食材，平日下班只需將食材放入鍋中，很快就能享用熱騰騰的晚餐。'
  },
  {
    question: '自己煮真的有比較省嗎？',
    answer: '絕對有！以一碗外送麻油雞湯麵約150元為例，自煮成本僅需約65元。每個月省下的外食費可以高達數千元，幫助你更快達成圓夢儲蓄目標。'
  },
  {
    question: '單人份的食材很難買，容易浪費怎麼辦？',
    answer: 'CooCoo煮煮提倡「精益採買」與「科學分裝」。我們會教你如何購買小份量食材，或將大份量食材一次處理分裝冷凍，確保零浪費。'
  },
  {
    question: '套房沒有抽油煙機，會有油煙味嗎？',
    answer: '不用擔心，我們的食譜多以水煮、蒸、悶、微煎為主，極少使用大火爆香或油炸，非常適合沒有抽油煙機的單身套房。'
  },
  {
    question: '洗碗很麻煩，有沒有免洗碗的食譜？',
    answer: '我們深知洗碗的痛苦！所以CooCoo煮煮的料理強調「一鍋到底」，通常只需要洗一個鍋子和一副餐具。'
  },
  {
    question: '不會煮飯的新手也學得會嗎？',
    answer: '完全沒問題。我們的料理步驟簡化到極致，不需要高超的刀工或火候控制，只要會把東西放進鍋子裡煮熟就行了。'
  },
  {
    question: '便當菜色帶去公司微波會不會變難吃？',
    answer: '我們有特別標註適合帶便當的菜色。例如燉煮類的咖哩、滷肉，微波後反而更入味更好吃！'
  },
  {
    question: 'CooCoo煮煮的APP什麼時候上線？',
    answer: '目前APP正在進行最後的封測階段，預計很快就會與大家見面。您可以先使用網站上的食譜開始您的自煮生活。'
  },
  {
    question: '我要如何分享我的自煮成果？',
    answer: '歡迎在社群媒體上標記 #CooCoo煮煮，與我們分享您的15分鐘料理與省錢成果！'
  },
  {
    question: '食材保存多久？冷凍會不會不新鮮？',
    answer: '肉類冷凍保存一個月內最佳，蔬菜冷藏約一週。只要掌握正確的密封與分裝技巧，冷凍食材的營養流失極少，解凍後依然能保持絕佳鮮度。'
  },
  {
    question: '哪裡可以買到小份量食材？',
    answer: '全聯、家樂福等超市都有販售單片裝肉品或半顆高麗菜等小包裝。另外，傳統市場也是尋寶好去處，可以請老闆依您需要的份量切配。'
  },
  {
    question: '一次採買大概花多少錢？',
    answer: '初期建議每週預算抓在 500-800 元左右，足夠涵蓋 5-7 餐的食材。隨著經驗增加，您會更懂得善用共用食材，採買成本還會再降低。'
  },
  {
    question: '我是完全零基礎，從哪道菜開始？',
    answer: '建議從「一鍋到底番茄蛋花麵」或「免開火涼拌小菜」開始。這些料理容錯率極高，只要跟著步驟把食材放進去，絕對能讓您信心大增！'
  },
  {
    question: '電磁爐功率要多少才夠用？',
    answer: '單人自煮建議選擇功率 800W-1200W 的電磁爐就綽綽有餘。我們的食譜大多不需要持續大火，這樣的功率既安全又能快速煮熟食材。'
  },
  {
    question: '快煮鍋跟電鍋差在哪？我該買哪個？',
    answer: '快煮鍋適合煮湯麵、水煮或微煎，加熱快且清洗方便；電鍋則擅長燉煮、蒸食與炊飯，可免顧火。若您喜歡麵食或快炒，選快煮鍋；若愛吃飯或燉肉，電鍋是首選。'
  },
  {
    question: '分裝冷凍要用什麼容器？',
    answer: '推薦使用可重複清洗的食品級矽膠夾鏈袋，或是有密封膠條的玻璃保鮮盒。這不僅能阻絕空氣防止凍傷，還能讓冰箱空間更整齊。'
  },
  {
    question: '自煮的營養會不會不均衡？',
    answer: '其實自煮更容易掌握營養！我們的食譜設計都會兼顧碳水、蛋白質與蔬菜。自己煮能清楚知道吃進什麼，比外食更能控制油鹽與熱量。'
  },
  {
    question: '上班族可以帶自煮便當嗎？怎麼加熱？',
    answer: '當然可以！前一晚多煮一份裝入便當盒，隔天帶去公司微波即可。我們的燉煮類食譜（如咖哩或滷肉）微波加熱後風味更佳。'
  },
  {
    question: '一個人吃飯好孤單，自煮的動力怎麼維持？',
    answer: '把自煮當作每天專屬的療癒時光吧！看著記帳本裡省下的餐費，或是為自己準備喜歡的配菜，都是滿滿的成就感。也歡迎加入我們的社群，和大家一起打卡交流。'
  },
  {
    question: '食材快過期了怎麼處理？',
    answer: '遇到快過期的蔬菜，通通切碎煮成「蔬菜煎餅」或丟進電鍋煮成「雜菜炊飯」是最棒的 Plan B。肉類若來不及吃完，請在過期前先醃製後冷凍，能延長保存期限。'
  },
  {
    question: '租屋處會有油煙味嗎？房東會不會有意見？',
    answer: 'CooCoo煮煮的食譜專為無抽油煙機的套房設計，避開了大火爆香與油炸。以水煮、蒸燜為主的烹調方式，幾乎不會產生油煙，房東也不會擔心。'
  },
  {
    question: '自煮和叫外送的時間成本比較？',
    answer: '等待外送通常需要 20-40 分鐘，而我們的 15 分鐘快煮食譜，讓您在等待的時間內就能完成備料、烹煮與上桌。不僅更省時，還能馬上享用熱騰騰的美食。'
  },
  {
    question: 'CooCoo煮煮的圓夢儲蓄是什麼？',
    answer: '這是一個把「省下的餐費具象化」的概念。每天記錄外食與自煮的差額，看著這筆錢累積起來成為您的旅遊基金或進修費用，讓下廚變得更有動力。'
  },
  {
    question: '如何計算自煮省下的錢？',
    answer: '我們會在每道食譜標示「預估自煮成本」與「市售等值價格」。只要將兩者相減，就是您這一餐省下來的錢。日積月累，這筆省下的費用將會非常可觀。'
  }
];

export default function FAQPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      }
    }))
  };

  return (
    <div className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className={styles.wrapper}>
        <h1 className={styles.title}>常見問題</h1>
        <div className={styles.faqList}>
          {faqs.map((faq, index) => (
            <div key={index} className={styles.faqItem}>
              <h2 className={styles.question}>{faq.question}</h2>
              <p className={styles.answer}>{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
