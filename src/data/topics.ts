/**
 * Sets de vocabulario por temas.
 *
 * CURADO A MANO. A diferencia del resto de src/data, este archivo no lo
 * genera ningún script: la pertenencia de cada palabra a un tema es una
 * decisión editorial. Criterios (docs/DATA_SOURCES.md, «Sets por temas»):
 *
 * - Solo se usan palabras que ya están en el dataset (HSK 1-4). Aquí no se
 *   añade vocabulario, ni significados, ni pinyin: todo eso viene del
 *   dataset. Un test comprueba que cada id existe.
 * - Una palabra entra en un tema si alguno de los significados que muestra
 *   la app (los de CC-CEDICT) pertenece a ese tema: 云 «(classical) to say;
 *   cloud» entra en «Weather». Si el sentido del tema no está entre ellos, no
 *   entra aunque exista: 点 no está en «Time» porque no muestra «o'clock».
 * - Una palabra puede estar en varios temas (鱼: «Food & drink» y «Animals»).
 *
 * Añadir un tema = añadir un objeto a esta lista; la interfaz no cambia.
 */
export interface TopicDefinition {
  /** Id del set: "topic-" + este id. */
  id: string
  name: string
  description: string
  /** Un carácter decorativo para la tarjeta del set. */
  icon: string
  /** Ids de palabras del dataset (Word.id). */
  words: readonly string[]
}

export const TOPIC_CURATION_NOTE =
  'Topics are curated by hand from the HSK 1-4 word list. Words, pinyin and meanings come from the dataset.'

export const topicDefinitions: readonly TopicDefinition[] = [
  {
    id: 'food',
    name: 'Food & drink',
    description: 'Meals, dishes, fruit, drinks and flavors.',
    icon: '食',
    words: [
      '菜', '茶', '吃', '喝', '饭馆', '米饭', '苹果', '水果', '水', '杯子', '好吃', '鸡蛋', '咖啡', '牛奶',
      '羊肉', '西瓜', '鱼', '饱', '菜单', '蛋糕', '饿', '果汁', '筷子', '渴', '面包', '面条', '米', '盘子',
      '啤酒', '葡萄', '糖', '甜', '碗', '香蕉', '厨房', '饼干', '尝', '干杯', '饺子', '辣', '苦', '酸', '汤',
      '西红柿', '盐', '咸', '饮料', '巧克力', '食品', '味道', '香',
    ],
  },
  {
    id: 'family',
    name: 'Family',
    description: 'Parents, siblings, relatives and married life.',
    icon: '家',
    words: [
      '爸爸', '妈妈', '儿子', '女儿', '家', '弟弟', '哥哥', '姐姐', '妹妹', '孩子', '妻子', '丈夫', '阿姨',
      '奶奶', '爷爷', '叔叔', '父亲', '母亲', '孙子', '亲戚', '结婚',
    ],
  },
  {
    id: 'travel',
    name: 'Travel',
    description: 'Trips, places, documents and sightseeing.',
    icon: '旅',
    words: [
      '北京', '中国', '飞机', '火车站', '旅游', '机场', '票', '宾馆', '护照', '地图', '行李箱', '城市', '国家',
      '世界', '长城', '长江', '出发', '导游', '大使馆', '航班', '签证', '起飞', '风景', '参观', '首都', '亚洲',
      '地址',
    ],
  },
  {
    id: 'school',
    name: 'School & university',
    description: 'Classes, exams, homework and studying.',
    icon: '学',
    words: [
      '老师', '同学', '学生', '学习', '学校', '书', '读', '写', '字', '汉语', '教室', '考试', '课', '回答',
      '作业', '班', '复习', '黑板', '句子', '练习', '年级', '铅笔', '数学', '图书馆', '校长', '字典', '历史',
      '成绩', '笔记本', '毕业', '博士', '词典', '答案', '教授', '教育', '留学', '硕士', '研究生', '语法', '预习',
      '专业', '知识', '寒假', '中文', '科学', '阅读',
    ],
  },
  {
    id: 'time',
    name: 'Time & dates',
    description: 'Days, weeks, seasons and talking about when.',
    icon: '时',
    words: [
      '今天', '明天', '昨天', '年', '月', '日', '星期', '上午', '中午', '下午', '晚上', '早上', '现在', '时候',
      '分钟', '小时', '时间', '号', '去年', '生日', '周末', '以后', '以前', '刚才', '马上', '最近', '一会儿',
      '刻', '季节', '春', '夏', '秋', '冬', '节日', '当时', '将来', '世纪', '刚刚', '后来', '按时', '准时', '提前',
    ],
  },
  {
    id: 'numbers',
    name: 'Numbers',
    description: 'Counting, quantities and ordinal numbers.',
    icon: '数',
    words: [
      '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '零', '两', '百', '千', '万', '亿', '几',
      '多少', '第一', '半', '双', '倍', '分之', '数字', '号码', '千万',
    ],
  },
  {
    id: 'weather',
    name: 'Weather',
    description: 'Temperature, rain, sun and the climate.',
    icon: '天',
    words: [
      '天气', '冷', '热', '下雨', '晴', '阴', '雪', '云', '刮', '太阳', '伞', '气候', '温度', '凉快', '暖和', '干燥',
      '湿润', '阳光',
    ],
  },
  {
    id: 'daily-life',
    name: 'Daily life',
    description: 'Home, routines, clothes and household things.',
    icon: '日',
    words: [
      '家', '房间', '睡觉', '起床', '洗', '洗澡', '洗手间', '打扫', '休息', '衣服', '穿', '桌子', '椅子',
      '杯子', '门', '电视', '打电话', '厨房', '冰箱', '空调', '灯', '楼', '邻居', '衬衫', '裤子', '裙子', '帽子',
      '鞋', '毛巾', '牙膏', '镜子', '袜子', '家具', '沙发', '窗户', '洗衣机', '钥匙', '垃圾桶', '收拾', '散步',
    ],
  },
  {
    id: 'emotions',
    name: 'Emotions',
    description: 'Feelings, moods and how people react.',
    icon: '心',
    words: [
      '爱', '喜欢', '高兴', '快乐', '笑', '哭', '担心', '害怕', '生气', '难过', '满意', '着急', '放心', '关心',
      '爱情', '感动', '感情', '激动', '烦恼', '伤心', '失望', '羡慕', '兴奋', '幸福', '愉快', '紧张', '孤单',
      '害羞', '后悔', '得意', '吃惊', '讨厌', '同情', '心情', '流泪',
    ],
  },
  {
    id: 'body',
    name: 'Body & health',
    description: 'Parts of the body, illness and the doctor.',
    icon: '身',
    words: [
      '身体', '眼睛', '鼻子', '耳朵', '脸', '头发', '脚', '腿', '肚子', '皮肤', '嘴', '血', '汗', '生病', '医生',
      '医院', '药', '发烧', '感冒', '疼', '健康', '舒服', '咳嗽', '打针', '大夫', '护士', '难受', '胖', '瘦',
      '减肥',
    ],
  },
  {
    id: 'shopping',
    name: 'Shopping & money',
    description: 'Buying, prices, paying and stores.',
    icon: '买',
    words: [
      '买', '卖', '钱', '块', '元', '商店', '贵', '便宜', '超市', '银行', '打折', '购物', '顾客', '价格', '免费',
      '人民币', '售货员', '塑料袋', '信用卡', '市场', '逛',
    ],
  },
  {
    id: 'transportation',
    name: 'Transportation',
    description: 'Vehicles, stations, roads and traffic.',
    icon: '车',
    words: [
      '出租车', '飞机', '火车站', '公共汽车', '自行车', '船', '地铁', '机场', '司机', '辆', '骑', '路', '街道',
      '站', '堵车', '交通', '加油站', '乘坐', '航班', '桥',
    ],
  },
  {
    id: 'nature',
    name: 'Nature',
    description: 'Plants, water, the sky and the natural world.',
    icon: '山',
    words: [
      '花', '草', '树', '河', '太阳', '月亮', '云', '动物', '地球', '海洋', '森林', '植物', '叶子', '自然',
      '空气', '火', '环境', '风景',
    ],
  },
  {
    id: 'technology',
    name: 'Technology',
    description: 'Computers, phones, the internet and devices.',
    icon: '电',
    words: ['电脑', '电视', '手机', '上网', '电子', '照相机', '网站', '密码', '传真', '复印', '打印', '技术', '科学', '广播'],
  },
  {
    id: 'work',
    name: 'Work',
    description: 'Jobs, offices, colleagues and professions.',
    icon: '工',
    words: [
      '工作', '上班', '公司', '办公室', '经理', '同事', '会议', '出差', '加班', '工资', '奖金', '招聘', '职业',
      '律师', '记者', '警察', '演员', '护士', '医生', '老师', '司机', '服务员', '售货员', '导游', '负责', '任务',
      '管理', '请假', '做生意', '收入', '经验',
    ],
  },
  {
    id: 'animals',
    name: 'Animals',
    description: 'Pets, farm animals and wild animals.',
    icon: '鸟',
    words: ['动物', '狗', '猫', '鱼', '马', '鸟', '熊猫', '老虎', '猴子', '狮子', '猪'],
  },
  {
    id: 'colors',
    name: 'Colors',
    description: 'Basic color words.',
    icon: '色',
    words: ['颜色', '白', '黑', '红', '蓝', '绿', '黄'],
  },
]
