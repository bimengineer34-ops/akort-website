// One-time DB seed: runs automatically on server start (see src/db/client.ts
// callers) whenever a table is still empty. Populates the database from the
// content that used to live in hard-coded .astro files / markdown / YAML, so
// the first deploy isn't blank. After this, the DB is the source of truth —
// nothing reads these original files anymore.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import { db } from '../src/db/client';
import { users, posts, projects, pages, settings, type PageFeatureItem, type PageApproachItem } from '../src/db/schema';
import { hashPassword, generateRandomPassword } from '../src/lib/auth';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

async function seedUsers() {
  const count = db.select().from(users).all().length;
  if (count > 0) return;

  const password = generateRandomPassword();
  const passwordHash = await hashPassword(password);
  db.insert(users).values({ username: 'admin', passwordHash, createdAt: new Date() }).run();

  console.log('\n==============================================');
  console.log(' İlk admin hesabı oluşturuldu:');
  console.log('   Kullanıcı adı: admin');
  console.log(`   Şifre:         ${password}`);
  console.log(' Bu şifre yalnızca burada gösterilecek — kaydedin ve');
  console.log(' ilk girişten sonra /admin/kullanicilar üzerinden değiştirin.');
  console.log('==============================================\n');
}

function seedPosts() {
  const count = db.select().from(posts).all().length;
  if (count > 0) return;

  const dir = path.join(root, 'src/data/post');
  if (!fs.existsSync(dir)) return;

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.md') && !file.endsWith('.mdx')) continue;
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const { data, content } = matter(raw);
    const slug = file.replace(/\.mdx?$/, '');
    db.insert(posts)
      .values({
        slug,
        title: data.title ?? slug,
        excerpt: data.excerpt ?? null,
        image: data.image ?? null,
        imageAlt: data.imageAlt ?? null,
        category: data.category ?? null,
        tags: data.tags ?? [],
        author: data.author ?? null,
        publishDate: data.publishDate ? new Date(data.publishDate) : new Date(),
        draft: Boolean(data.draft),
        body: content.trim(),
        updatedAt: new Date(),
      })
      .run();
  }
}

function seedProjects() {
  const count = db.select().from(projects).all().length;
  if (count > 0) return;

  const dir = path.join(root, 'src/data/project');
  if (!fs.existsSync(dir)) return;

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.md')) continue;
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const { data, content } = matter(raw);
    const slug = file.replace(/\.md$/, '');
    db.insert(projects)
      .values({
        slug,
        title: data.title ?? slug,
        excerpt: data.excerpt ?? null,
        image: data.image ?? null,
        imageAlt: data.imageAlt ?? null,
        tags: data.tags ?? [],
        client: data.client ?? null,
        location: data.location ?? null,
        year: data.year ? String(data.year) : null,
        area: data.area ?? null,
        scope: data.scope ?? null,
        need: data.need ?? null,
        solution: data.solution ?? null,
        systems: data.systems ?? [],
        outcomes: data.outcomes ?? [],
        draft: Boolean(data.draft),
        body: content.trim(),
        updatedAt: new Date(),
      })
      .run();
  }
}

interface PageSeed {
  slug: string;
  group: 'kurumsal' | 'hizmet' | 'diger';
  title: string;
  seoDescription: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  features?: PageFeatureItem[];
  approachTagline?: string;
  approachTitle?: string;
  approachItems?: PageApproachItem[];
  image?: string;
  imageAlt?: string;
  ctaTitle: string;
  ctaSubtitle: string;
}

const IMG = {
  a: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=85',
  b: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=85',
  c: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=1600&q=85',
  d: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=85',
};

const DEFAULT_CTA = {
  ctaTitle: 'Bir projeniz mi var?',
  ctaSubtitle: 'İhtiyacınızı birlikte değerlendirelim ve doğru mühendislik çözümünü oluşturalım.',
};

const pageSeeds: PageSeed[] = [
  {
    slug: 'hakkimizda',
    group: 'kurumsal',
    title: 'Hakkımızda',
    seoDescription:
      'AKORT Mühendislik; mekanik, elektrik, BIM, enerji, yapı ve çelik disiplinlerini tek çatı altında birleştiren multidisipliner bir mühendislik organizasyonudur.',
    tagline: 'Hakkımızda',
    heroTitle: 'Farklı disiplinleri, tek bir mühendislik anlayışında buluşturuyoruz.',
    heroSubtitle:
      'AKORT Mühendislik; mimari, yapı, mekanik, elektrik, enerji ve dijital mühendislik alanlarını tasarımdan uygulamaya kadar bütüncül bir bakış açısıyla yönetir. Amacımız yalnızca proje üretmek değil, doğru mühendislik kararlarının tüm süreç boyunca korunmasını sağlamaktır.',
    features: [
      {
        icon: 'tabler:shield-check',
        title: 'Şeffaf Mühendislik',
        description:
          'Aldığımız her teknik kararın gerekçesini, hesap ve standartlara dayandırarak paydaşlarla açık biçimde paylaşırız.',
      },
      {
        icon: 'tabler:sitemap',
        title: 'Koordineli Süreç',
        description: 'Disiplinler arasındaki kararları BIM ve düzenli proje kontrol süreçleriyle senkronize tutarız.',
      },
      {
        icon: 'tabler:hammer',
        title: 'Sahada Sınanmış Çözüm',
        description:
          'Tasarımı yalnızca çizim olarak değil; montaj, işletme ve bakım koşullarıyla birlikte değerlendiririz.',
      },
    ],
    approachTagline: 'Yaklaşımımız',
    approachTitle: 'AKORT ismi, koordinasyonu ifade eder.',
    approachItems: [
      {
        title: 'Multidisipliner Çalışma Modeli',
        description:
          'Mekanik, elektrik, BIM, enerji, mimari, yapı ve çelik disiplinlerini ayrı ayrı değil; birbiriyle koordineli tek bir mühendislik süreci olarak ele alıyoruz.',
      },
      {
        title: 'Tasarımdan Uygulamaya Süreklilik',
        description:
          'Projelerde tasarım aşamasında alınan kararların, saha uygulamasında da aynı bütünlükle sürdürülmesini önemsiyoruz.',
      },
      {
        title: 'Teknik Doğruluk',
        description:
          'Mühendislik hesapları, standartlar ve saha gerçekliği arasında denge kuran, uygulanabilir çözümler üretiyoruz.',
      },
    ],
    image: IMG.b,
    imageAlt: 'AKORT Mühendislik ekibi proje üzerinde çalışıyor',
    ...DEFAULT_CTA,
  },
  {
    slug: 'neden-akort',
    group: 'kurumsal',
    title: 'Neden AKORT?',
    seoDescription:
      'AKORT Mühendislik; multidisipliner yaklaşım, BIM odaklı çalışma, uygulanabilir tasarım ve sürekli proje kontrolü ile teknik kararların korunmasını sağlar.',
    tagline: 'Neden AKORT?',
    heroTitle: 'Teknik kararları, uyum içinde yönetiyoruz.',
    heroSubtitle:
      'Amacımız yalnızca proje üretmek değil; doğru mühendislik kararlarının tasarım, uygulama ve işletme boyunca korunmasını sağlamaktır.',
    features: [
      {
        icon: 'tabler:network',
        title: 'Multidisipliner Yaklaşım',
        description:
          'Farklı mühendislik disiplinlerinin tek merkezden koordinasyonunu sağlayarak çelişkili kararların önüne geçeriz.',
      },
      {
        icon: 'tabler:certificate',
        title: 'Teknik Uzmanlık',
        description: 'Çözümlerimizi mühendislik hesaplarına ve ilgili standartlara dayandırırız.',
      },
      {
        icon: 'tabler:cube-3d-sphere',
        title: 'BIM Odaklı Çalışma',
        description: 'Projeleri dijital ortamda koordine ederek çakışmaları uygulama öncesinde tespit ederiz.',
      },
      {
        icon: 'tabler:hammer',
        title: 'Uygulanabilir Tasarım',
        description: 'Kağıt üzerinde değil; sahada montaj, işletme ve bakım koşullarında çalışan projeler üretiriz.',
      },
      {
        icon: 'tabler:battery-eco',
        title: 'Enerji Verimliliği',
        description: 'Sistem seçimlerinde ilk yatırım ve işletme maliyetlerini birlikte değerlendiririz.',
      },
      {
        icon: 'tabler:clipboard-check',
        title: 'Proje Kontrolü',
        description: 'Tasarım ile saha uygulaması arasındaki tutarlılığı süreç boyunca sürekli kontrol ederiz.',
      },
    ],
    approachTagline: 'Farklı Disiplinler. Tek Hedef.',
    approachTitle: 'Koordinasyon, şansa bırakılmaz.',
    approachItems: [
      {
        title: 'Mimari → Yapı',
        description: 'Mimari kararlar, taşıyıcı sistem ve yapı çözümleriyle birlikte kurgulanır.',
      },
      { title: 'Mekanik → Elektrik', description: 'HVAC ve elektrik altyapısı, aynı koordinasyon modelinde ilerler.' },
      {
        title: 'BIM → Enerji → Uygulama',
        description: 'Dijital model üzerinden doğrulanan kararlar, sahada aynı bütünlükle uygulanır.',
      },
    ],
    image: IMG.c,
    imageAlt: 'BIM ve dijital mühendislik ile disiplin koordinasyonu',
    ctaTitle: 'Doğru mühendislik ortağını mı arıyorsunuz?',
    ctaSubtitle: 'İhtiyacınızı birlikte değerlendirelim ve doğru mühendislik çözümünü oluşturalım.',
  },
  {
    slug: 'calisma-yaklasimimiz',
    group: 'kurumsal',
    title: 'Çalışma Yaklaşımımız',
    seoDescription:
      'Analizden teslime, AKORT Mühendislik projelerini yöneten altı adımlı kontrollü mühendislik süreci.',
    tagline: 'Çalışma Yaklaşımımız',
    heroTitle: 'Tasarımdan uygulamaya, kontrollü bir süreç.',
    heroSubtitle:
      'Her proje aynı altı adımdan geçer: analiz, tasarım, koordinasyon, optimizasyon, uygulama ve teslim. Bu düzen, disiplinler arası kararların tutarlılığını baştan sona korur.',
    features: [
      {
        icon: 'tabler:search',
        title: '01 — Analiz',
        description:
          'Proje kriterlerini, saha verilerini ve teknik gereklilikleri; işveren ile birlikte netleştirerek başlarız.',
      },
      {
        icon: 'tabler:ruler-2',
        title: '02 — Tasarım',
        description: 'Disiplin bazlı mühendislik hesaplarını ve çözüm alternatiflerini geliştiririz.',
      },
      {
        icon: 'tabler:arrows-join-2',
        title: '03 — Koordinasyon',
        description: 'Tüm disiplinleri BIM modeli ve düzenli proje kontrol toplantılarıyla senkronize ederiz.',
      },
      {
        icon: 'tabler:adjustments-horizontal',
        title: '04 — Optimizasyon',
        description: 'Maliyet, enerji tüketimi ve uygulanabilirlik açısından sistemleri karşılaştırıp iyileştiririz.',
      },
      {
        icon: 'tabler:tool',
        title: '05 — Uygulama',
        description: 'Saha süreçlerini teknik şartname ve proje kriterleri doğrultusunda kontrol altında yürütürüz.',
      },
      {
        icon: 'tabler:circle-check',
        title: '06 — Teslim',
        description: 'Test, devreye alma, kontrol, as-built belgeleme ve teslim adımlarını tamamlarız.',
      },
    ],
    approachTagline: 'Neden Bu Sıra?',
    approachTitle: 'Her adım, bir sonrakinin doğruluğunu güvence altına alır.',
    approachItems: [
      {
        title: 'Erken Tespit',
        description: 'Koordinasyon aşamasında yakalanan bir çakışma, sahada onlarca kat daha maliyetli olabilir.',
      },
      {
        title: 'Geri Dönüşü Az Kararlar',
        description: 'Optimizasyon adımı, uygulamaya geçmeden önce sistem seçimlerini bir kez daha sınamamızı sağlar.',
      },
      {
        title: 'İzlenebilir Süreç',
        description: 'Proje kontrolü, tasarım kararlarının sahada da aynı şekilde korunduğunu teyit eder.',
      },
    ],
    image: IMG.a,
    imageAlt: 'Mühendislik ekibi proje kontrolü yapıyor',
    ctaTitle: 'Sürecimizi projenizde görmek ister misiniz?',
    ctaSubtitle: 'İhtiyacınızı birlikte değerlendirelim ve doğru mühendislik çözümünü oluşturalım.',
  },
  {
    slug: 'kalite-politikamiz',
    group: 'kurumsal',
    title: 'Kalite Politikamız',
    seoDescription:
      'AKORT Mühendislik projelerinde teknik doğruluk, izlenebilirlik ve sürekli kontrolü esas alan kalite ilkeleri.',
    tagline: 'Kalite Politikamız',
    heroTitle: 'Kaliteyi bir kontrol adımı değil, sürecin tamamı olarak görürüz.',
    heroSubtitle:
      'Mühendislik kararlarının doğruluğu; hesaba, standarda ve sahada doğrulanabilir sonuçlara dayanmalıdır. Kalite politikamız bu ilkeyi projenin her aşamasına taşır.',
    features: [
      {
        icon: 'tabler:certificate',
        title: 'Standartlara Uygunluk',
        description:
          'Tüm mühendislik hesapları ve çizimler, ilgili ulusal ve uluslararası standartlar esas alınarak hazırlanır.',
      },
      {
        icon: 'tabler:clipboard-check',
        title: 'Bağımsız Proje Kontrolü',
        description: 'Tasarım çıktıları, uygulamaya geçmeden önce disiplinler arası kontrol sürecinden geçer.',
      },
      {
        icon: 'tabler:history',
        title: 'İzlenebilir Revizyon Yönetimi',
        description: 'Her revizyon kayıt altına alınır; proje ekibi ve işveren aynı güncel bilgiye erişir.',
      },
      {
        icon: 'tabler:cube-3d-sphere',
        title: 'BIM ile Doğrulama',
        description: 'Disiplin çakışmaları, sahaya çıkmadan önce dijital model üzerinde tespit edilip çözülür.',
      },
      {
        icon: 'tabler:refresh',
        title: 'Saha Geri Bildirimi',
        description:
          'Uygulama sürecinden gelen bulgular, sonraki mühendislik kararlarına sistematik olarak yansıtılır.',
      },
      {
        icon: 'tabler:trending-up',
        title: 'Sürekli İyileştirme',
        description: 'Süreçlerimizi düzenli olarak gözden geçirir, tekrar eden riskleri kaynağında ortadan kaldırırız.',
      },
    ],
    image: undefined,
    ctaTitle: 'Kalite yaklaşımımızı projenizde konuşalım.',
    ctaSubtitle: 'İhtiyacınızı birlikte değerlendirelim ve doğru mühendislik çözümünü oluşturalım.',
  },
  {
    slug: 'mekanik-muhendislik',
    group: 'hizmet',
    title: 'Mekanik Mühendislik',
    seoDescription:
      'HVAC, sıhhi tesisat, yangın tesisatı, merkezi sistemler, ekipman seçimi ve hidrolik hesaplarla mekanik altyapı çözümleri.',
    tagline: 'Hizmetler / Mekanik Mühendislik',
    heroTitle: 'Mekanik Mühendislik',
    heroSubtitle:
      'HVAC, sıhhi tesisat, yangın tesisatı ve merkezi sistemleri; enerji verimliliği ve işletme kolaylığını gözeten bir mühendislik yaklaşımıyla tasarlıyoruz.',
    features: [
      {
        icon: 'tabler:wind',
        title: 'HVAC Sistemleri',
        description: 'Isıtma, soğutma ve havalandırma sistemlerinin tasarımı ve ekipman seçimi.',
      },
      {
        icon: 'tabler:droplet',
        title: 'Sıhhi Tesisat',
        description: 'İçme suyu, atık su ve yağmur suyu tesisatlarının projelendirilmesi.',
      },
      {
        icon: 'tabler:flame',
        title: 'Yangın Tesisatı',
        description: 'Sprinkler, hidrant ve yangın söndürme sistemlerinin mühendislik çözümleri.',
      },
      {
        icon: 'tabler:building-warehouse',
        title: 'Merkezi Sistemler',
        description: 'Bina genelinde merkezi ısıtma, soğutma ve kontrol sistemlerinin koordinasyonu.',
      },
      {
        icon: 'tabler:calculator',
        title: 'Ekipman Seçimi & Hidrolik Hesaplar',
        description: 'Debi, basınç kaybı ve kapasite hesaplarına dayalı doğru ekipman seçimi.',
      },
      {
        icon: 'tabler:network',
        title: 'Mekanik Altyapı Koordinasyonu',
        description: 'Mekanik sistemlerin elektrik, mimari ve yapı disiplinleriyle uyumlu kurgulanması.',
      },
    ],
    approachTagline: 'Yaklaşımımız',
    approachTitle: 'Doğru Ekipman, Doğru Yerde.',
    approachItems: [
      {
        title: 'Yük Hesabına Dayalı Tasarım',
        description: 'Isıtma/soğutma yüklerini ve su ihtiyacını gerçek kullanım senaryolarına göre hesaplarız.',
      },
      {
        title: 'Enerji Verimli Sistem Seçimi',
        description:
          'İlk yatırım ve işletme maliyetini birlikte değerlendiren ekipman ve sistem alternatifleri sunarız.',
      },
      {
        title: 'BIM ile Koordinasyon',
        description:
          'Mekanik tesisatı, elektrik ve mimari ile aynı model üzerinde koordine ederek çakışmaları önceden gideririz.',
      },
    ],
    image: IMG.c,
    imageAlt: 'Mekanik tesisat ve HVAC sistem koordinasyonu',
    ctaTitle: 'Mekanik altyapınızı konuşalım.',
    ctaSubtitle: 'Projenizin ihtiyaçlarını birlikte değerlendirelim ve doğru mühendislik çözümünü oluşturalım.',
  },
  {
    slug: 'elektrik-muhendisligi',
    group: 'hizmet',
    title: 'Elektrik Mühendisliği',
    seoDescription:
      'Kuvvetli akım, zayıf akım, enerji dağıtımı, aydınlatma ve otomasyon sistemlerinin projelendirilmesi.',
    tagline: 'Hizmetler / Elektrik Mühendisliği',
    heroTitle: 'Elektrik Mühendisliği',
    heroSubtitle:
      'Kuvvetli akım, zayıf akım, enerji dağıtımı ve otomasyon sistemlerini; güvenlik, verimlilik ve gelecekteki genişleme ihtiyaçlarını gözeterek tasarlıyoruz.',
    features: [
      {
        icon: 'tabler:bolt',
        title: 'Kuvvetli Akım',
        description: 'Enerji dağıtım panoları, kablolama ve topraklama sistemlerinin projelendirilmesi.',
      },
      {
        icon: 'tabler:broadcast',
        title: 'Zayıf Akım',
        description: 'Haberleşme, güvenlik ve yapısal kablolama altyapılarının tasarımı.',
      },
      {
        icon: 'tabler:transform',
        title: 'Enerji Dağıtımı',
        description: 'Trafo, pano ve dağıtım hattı kapasitelerinin doğru boyutlandırılması.',
      },
      {
        icon: 'tabler:bulb',
        title: 'Aydınlatma',
        description: 'İç ve dış mekan aydınlatma tasarımı; konfor ve enerji verimliliği dengesi.',
      },
      {
        icon: 'tabler:cpu',
        title: 'Otomasyon',
        description: 'Bina otomasyonu ve kontrol sistemlerinin diğer disiplinlerle entegrasyonu.',
      },
      {
        icon: 'tabler:plug',
        title: 'Elektrik Altyapı Sistemleri',
        description: 'Acil durum, UPS ve yedekli güç sistemlerinin planlanması.',
      },
    ],
    approachTagline: 'Yaklaşımımız',
    approachTitle: 'Güvenli, Ölçeklenebilir Altyapı.',
    approachItems: [
      {
        title: 'Kapasite Planlaması',
        description: 'Mevcut ve gelecekteki yük artışlarını hesaba katan pano ve hat boyutlandırması yaparız.',
      },
      {
        title: 'Standartlara Uygunluk',
        description: 'Tasarımlarımızı ilgili elektrik tesisat standartlarına ve yönetmeliklere dayandırırız.',
      },
      {
        title: 'Mekanik ile Koordinasyon',
        description:
          'Elektrik altyapısını mekanik ve BIM modeliyle senkronize ederek çakışmaları önceden tespit ederiz.',
      },
    ],
    image: IMG.a,
    imageAlt: 'Elektrik altyapı ve enerji dağıtım sistemleri tasarımı',
    ctaTitle: 'Elektrik altyapınızı konuşalım.',
    ctaSubtitle: 'Projenizin ihtiyaçlarını birlikte değerlendirelim ve doğru mühendislik çözümünü oluşturalım.',
  },
  {
    slug: 'bim',
    group: 'hizmet',
    title: 'BIM & Dijital Mühendislik',
    seoDescription:
      'BIM modelleme, MEP koordinasyonu, clash detection, shop drawing, metraj ve dijital proje iş akışları.',
    tagline: 'Hizmetler / BIM & Dijital Mühendislik',
    heroTitle: 'Mühendisliği Dijitalleştiriyoruz.',
    heroSubtitle:
      'Projeyi sahaya gelmeden önce görüyor, koordine ediyor ve optimize ediyoruz. BIM, disiplinler arası kararların aynı doğrulukla ilerlemesini sağlar.',
    features: [
      {
        icon: 'tabler:cube-3d-sphere',
        title: 'BIM Modelleme',
        description: 'Mimari, mekanik ve elektrik sistemlerinin koordineli ve veriye dayalı modellenmesi.',
      },
      {
        icon: 'tabler:network',
        title: 'MEP Coordination',
        description: 'Mekanik, elektrik ve sıhhi tesisat disiplinlerinin dijital ortamda senkronizasyonu.',
      },
      {
        icon: 'tabler:alert-triangle',
        title: 'Clash Detection',
        description: 'Disiplin çakışmalarının uygulama öncesinde tespit edilmesi ve çözülmesi.',
      },
      {
        icon: 'tabler:file-description',
        title: 'Shop Drawing & As-Built BIM',
        description: 'Saha uygulamasına yönelik imalat çizimleri ve uygulama sonrası güncel modeller.',
      },
      {
        icon: 'tabler:file-check',
        title: 'Metraj & Model Kontrolü',
        description: 'Model tabanlı metraj çıkarımı ve teknik proje kontrolü.',
      },
      {
        icon: 'tabler:sitemap',
        title: 'Dijital İş Akışları',
        description: 'Proje verilerinin tüm paydaşlar arasında tutarlı biçimde yönetilmesi.',
      },
    ],
    approachTagline: 'Neden BIM?',
    approachTitle: 'Hatayı sahada değil, ekranda bulmak.',
    approachItems: [
      {
        title: 'Erken Çakışma Tespiti',
        description: 'Disiplinler arası çakışmaları, inşaat başlamadan modelde tespit ederiz.',
      },
      {
        title: 'Doğru Metraj',
        description: 'Model üzerinden çıkarılan metrajlar, keşif ve hakediş süreçlerini hızlandırır.',
      },
      {
        title: 'Tek Doğru Kaynak',
        description: 'Tüm disiplinler aynı güncel modele erişerek tutarsızlıkların önüne geçer.',
      },
    ],
    image: IMG.c,
    imageAlt: 'BIM modelleme ve dijital mühendislik çalışma ortamı',
    ctaTitle: 'Projenizi BIM ile koordine edelim.',
    ctaSubtitle: 'İhtiyacınızı birlikte değerlendirelim ve doğru mühendislik çözümünü oluşturalım.',
  },
  {
    slug: 'enerji-verimliligi',
    group: 'hizmet',
    title: 'Enerji & Enerji Verimliliği',
    seoDescription:
      'Enerji analizleri, sistem optimizasyonu, tüketim azaltımı ve yaşam döngüsü maliyetini dikkate alan mühendislik çözümleri.',
    tagline: 'Hizmetler / Enerji & Enerji Verimliliği',
    heroTitle: 'Enerji & Enerji Verimliliği',
    heroSubtitle:
      'Sistem seçimlerinde ilk yatırım maliyetini değil; yaşam döngüsü boyunca enerji tüketimini ve işletme giderlerini birlikte değerlendiriyoruz.',
    features: [
      {
        icon: 'tabler:gauge',
        title: 'Enerji Analizleri',
        description: 'Bina ve tesislerin enerji tüketim profilinin çıkarılması ve değerlendirilmesi.',
      },
      {
        icon: 'tabler:adjustments',
        title: 'Sistem Optimizasyonu',
        description: 'Mekanik ve elektrik sistemlerinde verimlilik odaklı iyileştirme önerileri.',
      },
      {
        icon: 'tabler:battery-eco',
        title: 'Tüketim Azaltımı',
        description: 'Aydınlatma, HVAC ve otomasyon üzerinden somut tüketim azaltım stratejileri.',
      },
      {
        icon: 'tabler:calculator',
        title: 'Yaşam Döngüsü Maliyeti',
        description: 'İlk yatırım ile işletme maliyetlerini birlikte değerlendiren karar destek analizleri.',
      },
      {
        icon: 'tabler:file-check',
        title: 'Enerji Kimlik Belgesi Danışmanlığı',
        description: 'Mevzuat kapsamındaki enerji performansı değerlendirme süreçlerine teknik destek.',
      },
      {
        icon: 'tabler:leaf',
        title: 'Sürdürülebilir Sistemler',
        description: 'Yenilenebilir kaynaklarla entegre, düşük karbonlu sistem alternatifleri.',
      },
    ],
    approachTagline: 'Yaklaşımımız',
    approachTitle: 'Verimlilik, tasarımın bir parçasıdır.',
    approachItems: [
      {
        title: 'Veriye Dayalı Karar',
        description: 'Öneri geliştirmeden önce mevcut veya planlanan tüketim verisini analiz ederiz.',
      },
      {
        title: 'Bütüncül Değerlendirme',
        description: 'Mekanik, elektrik ve yapı kabuğunu birlikte ele alarak gerçekçi kazanımlar hedefleriz.',
      },
      {
        title: 'Ölçülebilir Sonuç',
        description: 'Önerdiğimiz her iyileştirmeyi somut, izlenebilir performans göstergeleriyle ilişkilendiririz.',
      },
    ],
    image: IMG.b,
    imageAlt: 'Enerji verimliliği ve sürdürülebilir mühendislik sistemleri',
    ctaTitle: 'Enerji performansınızı birlikte değerlendirelim.',
    ctaSubtitle: 'İhtiyacınızı anlatın, doğru mühendislik çözümünü birlikte oluşturalım.',
  },
  {
    slug: 'ges',
    group: 'hizmet',
    title: 'GES — Güneş Enerjisi Sistemleri',
    seoDescription:
      'Güneş enerji sistemlerinde fizibilite, tasarım, mühendislik ve uygulama koordinasyonu ile teknik danışmanlık hizmetleri.',
    tagline: 'Hizmetler / GES',
    heroTitle: 'Güneş Enerjisi Sistemleri (GES)',
    heroSubtitle:
      'Fizibiliteden devreye almaya, güneş enerji sistemlerinin mühendislik süreçlerini uçtan uca yönetiyoruz.',
    features: [
      {
        icon: 'tabler:gauge',
        title: 'Fizibilite',
        description: 'Saha potansiyeli, üretim tahmini ve yatırım geri dönüş analizi.',
      },
      {
        icon: 'tabler:map-2',
        title: 'Saha Etüdü',
        description: 'Gölgelenme, eğim ve zemin koşullarının teknik değerlendirmesi.',
      },
      {
        icon: 'tabler:solar-panel-2',
        title: 'Sistem Tasarımı',
        description: 'Panel dizilimi, invertör seçimi ve elektriksel sistem tasarımı.',
      },
      {
        icon: 'tabler:plug',
        title: 'Şebeke Bağlantı Mühendisliği',
        description: 'Bağlantı anlaşması süreçlerine teknik destek ve koordinasyon.',
      },
      {
        icon: 'tabler:tools',
        title: 'Uygulama Koordinasyonu',
        description: 'Kurulum sürecinin mühendislik esaslarına uygun yürütülmesi.',
      },
      {
        icon: 'tabler:bulb',
        title: 'Teknik Danışmanlık',
        description: 'İşletme dönemi performans takibi ve teknik sorunlara çözüm önerileri.',
      },
    ],
    approachTagline: 'Yaklaşımımız',
    approachTitle: 'Üretimi garanti eden mühendislik.',
    approachItems: [
      {
        title: 'Doğru Boyutlandırma',
        description: 'Tüketim profiline uygun, ne eksik ne fazla kapasitede sistemler tasarlarız.',
      },
      {
        title: 'Elektrik Altyapısıyla Uyum',
        description: 'GES sistemini mevcut veya planlanan elektrik altyapısıyla sorunsuz entegre ederiz.',
      },
      { title: 'Uygulama Takibi', description: 'Kurulumun tasarım kriterlerine uygun ilerlediğini sahada denetleriz.' },
    ],
    image: IMG.a,
    imageAlt: 'Güneş enerjisi sistemleri mühendislik ve uygulama süreci',
    ctaTitle: 'GES yatırımınızı konuşalım.',
    ctaSubtitle: 'Saha bilgilerinizi paylaşın, fizibilite değerlendirmesine birlikte başlayalım.',
  },
  {
    slug: 'mimari',
    group: 'hizmet',
    title: 'Mimari',
    seoDescription: 'Konsept tasarımdan uygulama projesine, disiplinlerle koordineli mimari mühendislik çözümleri.',
    tagline: 'Hizmetler / Mimari',
    heroTitle: 'Mimari',
    heroSubtitle:
      'Mimari kararları; yapı, mekanik, elektrik ve enerji disiplinleriyle birlikte kurgulayarak, tasarımın sahada da doğru çalışmasını sağlıyoruz.',
    features: [
      {
        icon: 'tabler:template',
        title: 'Konsept Tasarım',
        description: 'Proje ihtiyaçlarına uygun mekansal kurgu ve ön tasarım alternatifleri.',
      },
      {
        icon: 'tabler:building-arch',
        title: 'Avan & Uygulama Projeleri',
        description: 'Ruhsat ve uygulama aşamalarına yönelik detaylı mimari çizimler.',
      },
      {
        icon: 'tabler:network',
        title: 'Disiplinler Arası Koordinasyon',
        description: 'Mimari kararların mekanik, elektrik ve yapı ile uyumlu ilerlemesi.',
      },
      {
        icon: 'tabler:layout',
        title: 'Cephe ve Malzeme Detaylandırma',
        description: 'Performans ve estetik dengesini gözeten cephe ve malzeme çözümleri.',
      },
      {
        icon: 'tabler:file-check',
        title: 'Ruhsat Süreç Desteği',
        description: 'İmar ve ruhsat süreçlerinde gerekli teknik dokümantasyonun hazırlanması.',
      },
      {
        icon: 'tabler:leaf',
        title: 'Sürdürülebilir Tasarım',
        description: 'Enerji performansını gözeten, çevresel etkisi düşük tasarım kararları.',
      },
    ],
    approachTagline: 'Yaklaşımımız',
    approachTitle: 'Mimari, tek başına bir disiplin değildir.',
    approachItems: [
      {
        title: 'Erken Koordinasyon',
        description: 'Mekanik ve elektrik gereksinimlerini tasarımın en başından itibaren dikkate alırız.',
      },
      {
        title: 'Uygulanabilir Detay',
        description: 'Cephe ve malzeme kararlarını, imalat ve montaj gerçekliğiyle birlikte değerlendiririz.',
      },
      {
        title: 'Enerji Bilinci',
        description: 'Yapı kabuğu kararlarının enerji performansına etkisini tasarım aşamasında hesaba katarız.',
      },
    ],
    image: IMG.b,
    imageAlt: 'Mimari tasarım ve disiplinler arası koordinasyon',
    ctaTitle: 'Mimari projenizi konuşalım.',
    ctaSubtitle: 'İhtiyacınızı birlikte değerlendirelim ve doğru mühendislik çözümünü oluşturalım.',
  },
  {
    slug: 'yapi-insaat',
    group: 'hizmet',
    title: 'Yapı & İnşaat',
    seoDescription: 'Statik proje, yapısal detaylandırma, malzeme ve sistem seçimi ile uygulama koordinasyonu.',
    tagline: 'Hizmetler / Yapı & İnşaat',
    heroTitle: 'Yapı & İnşaat',
    heroSubtitle:
      'Taşıyıcı sistem kararlarını; mimari, zemin koşulları ve uygulama gerçekliğiyle birlikte değerlendirerek güvenli ve ekonomik yapı çözümleri üretiyoruz.',
    features: [
      {
        icon: 'tabler:building-skyscraper',
        title: 'Statik Proje',
        description: 'Taşıyıcı sistem analizi ve betonarme/çelik statik projelerinin hazırlanması.',
      },
      {
        icon: 'tabler:map-2',
        title: 'Zemin Etüdü Değerlendirmesi',
        description: 'Jeoteknik verilerin taşıyıcı sistem tasarımına doğru şekilde yansıtılması.',
      },
      {
        icon: 'tabler:ruler-2',
        title: 'Yapısal Detaylandırma',
        description: 'Bağlantı, donatı ve uygulama detaylarının imalata uygun hazırlanması.',
      },
      {
        icon: 'tabler:stack-2',
        title: 'Malzeme ve Sistem Seçimi',
        description: 'Proje ölçeği ve bütçesine uygun yapı sistemi ve malzeme alternatifleri.',
      },
      {
        icon: 'tabler:tools',
        title: 'Uygulama Koordinasyonu',
        description: 'Statik projenin sahada doğru uygulandığının teknik takibi.',
      },
      {
        icon: 'tabler:clipboard-check',
        title: 'Teknik Proje Kontrolü',
        description: 'Tasarım ile imalat arasındaki tutarlılığın sürekli denetimi.',
      },
    ],
    approachTagline: 'Yaklaşımımız',
    approachTitle: 'Güvenlik ve ekonomi arasında doğru denge.',
    approachItems: [
      {
        title: 'Gerçekçi Yük Varsayımları',
        description: 'Taşıyıcı sistem tasarımını gerçek kullanım ve çevresel yüklere göre kurgularız.',
      },
      { title: 'Mimari ile Uyum', description: 'Statik kararları, mimari mekan kurgusunu bozmadan optimize ederiz.' },
      { title: 'Sahada Doğrulama', description: 'Uygulama sürecinde projeden sapmaları erken tespit ederiz.' },
    ],
    image: IMG.d,
    imageAlt: 'Yapı ve inşaat mühendisliği uygulama süreci',
    ctaTitle: 'Yapı projenizi konuşalım.',
    ctaSubtitle: 'İhtiyacınızı birlikte değerlendirelim ve doğru mühendislik çözümünü oluşturalım.',
  },
  {
    slug: 'celik-yapilar',
    group: 'hizmet',
    title: 'Çelik Yapılar',
    seoDescription: 'Çelik konstrüksiyon tasarımı, detaylandırılması, imalat koordinasyonu ve montaj denetimi.',
    tagline: 'Hizmetler / Çelik Yapılar',
    heroTitle: 'Çelik Yapılar',
    heroSubtitle:
      'Çelik konstrüksiyon projelerini; statik doğruluk, imalat kolaylığı ve montaj güvenliğini birlikte gözeterek tasarlıyoruz.',
    features: [
      {
        icon: 'tabler:building-warehouse',
        title: 'Çelik Konstrüksiyon Tasarımı',
        description: 'Endüstriyel ve büyük açıklıklı yapılar için çelik taşıyıcı sistem tasarımı.',
      },
      {
        icon: 'tabler:gauge',
        title: 'Statik & Dinamik Analiz',
        description: 'Rüzgar, deprem ve işletme yükleri altında yapısal davranışın analizi.',
      },
      {
        icon: 'tabler:ruler-2',
        title: 'Bağlantı Detaylandırma',
        description: 'Kaynaklı ve bulonlu bağlantı detaylarının imalata uygun hazırlanması.',
      },
      {
        icon: 'tabler:file-description',
        title: 'Shop Drawing',
        description: 'İmalat atölyesi için ölçekli ve detaylı üretim çizimleri.',
      },
      {
        icon: 'tabler:sitemap',
        title: 'İmalat Koordinasyonu',
        description: 'Tasarım ile atölye üretim süreci arasındaki teknik uyumun sağlanması.',
      },
      {
        icon: 'tabler:shield-check',
        title: 'Montaj Denetimi',
        description: 'Sahada montaj sürecinin proje ve güvenlik kriterlerine uygun yürütülmesi.',
      },
    ],
    approachTagline: 'Yaklaşımımız',
    approachTitle: 'Tasarımdan atölyeye, kesintisiz doğruluk.',
    approachItems: [
      {
        title: 'İmalata Uygun Tasarım',
        description: 'Detayları, atölyenin gerçek üretim kapasitesi ve yöntemleriyle uyumlu kurgularız.',
      },
      {
        title: 'Toleransları Öngörme',
        description: 'Montaj toleranslarını tasarım aşamasında hesaba katarak saha sürprizlerini azaltırız.',
      },
      {
        title: 'Güvenlik Odaklı Montaj',
        description: 'Montaj sırasını ve geçici stabiliteyi proje aşamasında planlarız.',
      },
    ],
    image: IMG.d,
    imageAlt: 'Çelik konstrüksiyon tasarım ve montaj süreci',
    ctaTitle: 'Çelik yapı projenizi konuşalım.',
    ctaSubtitle: 'İhtiyacınızı birlikte değerlendirelim ve doğru mühendislik çözümünü oluşturalım.',
  },
  {
    slug: 'teknik-danismanlik',
    group: 'hizmet',
    title: 'Teknik Danışmanlık',
    seoDescription:
      'Proje uygunluk incelemesi, ikinci göz denetimi, fizibilite çalışmaları ve standart uyum değerlendirmesi.',
    tagline: 'Hizmetler / Teknik Danışmanlık',
    heroTitle: 'Teknik Danışmanlık',
    heroSubtitle:
      'Mevcut veya planlanan projelerinizi; teknik uygunluk, uygulanabilirlik ve standartlara uyum açısından bağımsız bir gözle değerlendiriyoruz.',
    features: [
      {
        icon: 'tabler:checklist',
        title: 'Proje Uygunluk İncelemesi',
        description: 'Mevcut projelerin teknik doğruluk ve uygulanabilirlik açısından değerlendirilmesi.',
      },
      {
        icon: 'tabler:eye-check',
        title: 'İkinci Göz Denetimi (Peer Review)',
        description: 'Bağımsız bir mühendislik gözüyle tasarım kararlarının teyit edilmesi.',
      },
      {
        icon: 'tabler:gauge',
        title: 'Fizibilite Çalışmaları',
        description: 'Teknik ve ekonomik açıdan proje uygulanabilirliğinin analizi.',
      },
      {
        icon: 'tabler:certificate',
        title: 'Standart & Yönetmelik Uyum Değerlendirmesi',
        description: 'Projelerin ilgili mevzuat ve standartlarla uyumunun kontrolü.',
      },
      {
        icon: 'tabler:file-description',
        title: 'Teknik Raporlama',
        description: 'Bulguların açık, gerekçeli ve uygulanabilir raporlar halinde sunulması.',
      },
      {
        icon: 'tabler:bulb',
        title: 'Uzman Görüşü',
        description: 'Karmaşık teknik konularda karar destek amaçlı uzman değerlendirmesi.',
      },
    ],
    approachTagline: 'Yaklaşımımız',
    approachTitle: 'Bağımsız bakış, daha sağlam karar.',
    approachItems: [
      {
        title: 'Tarafsız Değerlendirme',
        description: 'Projeyi üreten ekipten bağımsız bir gözle, yalnızca teknik doğruluğu esas alarak inceleriz.',
      },
      {
        title: 'Somut Bulgular',
        description:
          'Genel yorumlar yerine, hangi kararın neden gözden geçirilmesi gerektiğini net biçimde ortaya koyarız.',
      },
      {
        title: 'Uygulanabilir Öneriler',
        description: 'Her bulguyu, hayata geçirilebilir bir aksiyon önerisiyle birlikte sunarız.',
      },
    ],
    image: IMG.a,
    imageAlt: 'Teknik danışmanlık ve proje inceleme süreci',
    ctaTitle: 'Projenizi bağımsız bir gözle değerlendirelim.',
    ctaSubtitle: 'İhtiyacınızı birlikte değerlendirelim ve doğru mühendislik çözümünü oluşturalım.',
  },
  {
    slug: 'proje-kontrol',
    group: 'hizmet',
    title: 'Proje Kontrol',
    seoDescription:
      'Tasarım ile saha uygulaması arasındaki tutarlılığın sürekli denetimi, revizyon yönetimi ve raporlama.',
    tagline: 'Hizmetler / Proje Kontrol',
    heroTitle: 'Proje Kontrol',
    heroSubtitle:
      'Tasarımda alınan kararların, saha uygulamasında da aynı bütünlükle korunduğunu; süreç boyunca sürekli kontrol ederek güvence altına alıyoruz.',
    features: [
      {
        icon: 'tabler:clipboard-check',
        title: 'Tasarım-Saha Tutarlılık Kontrolü',
        description: 'Uygulamanın onaylı projeye uygun ilerlediğinin düzenli denetimi.',
      },
      {
        icon: 'tabler:history',
        title: 'Revizyon Yönetimi',
        description: 'Proje değişikliklerinin kayıt altına alınması ve ilgili taraflara doğru iletilmesi.',
      },
      {
        icon: 'tabler:alert-triangle',
        title: 'Disiplinler Arası Çakışma Takibi',
        description: 'Sahada ortaya çıkabilecek disiplin çakışmalarının erken tespiti.',
      },
      {
        icon: 'tabler:checklist',
        title: 'Şartname Uygunluk Denetimi',
        description: 'Uygulanan malzeme ve yöntemlerin teknik şartnameye uygunluğunun kontrolü.',
      },
      {
        icon: 'tabler:calculator',
        title: 'Metraj & Hakediş Kontrolü',
        description: 'İmalat miktarlarının ve hakediş taleplerinin projeyle karşılaştırılması.',
      },
      {
        icon: 'tabler:file-description',
        title: 'Raporlama',
        description: 'Süreç durumunun düzenli, anlaşılır raporlarla paydaşlara aktarılması.',
      },
    ],
    approachTagline: 'Yaklaşımımız',
    approachTitle: 'Kontrol, sürecin sonunda değil içinde olmalı.',
    approachItems: [
      {
        title: 'Düzenli Saha Ziyaretleri',
        description: 'Uygulamayı belirli aralıklarla yerinde inceleyerek sapmaları erken yakalarız.',
      },
      { title: 'Net İletişim', description: 'Bulguları, sorumlu taraflarla doğrudan ve zaman kaybetmeden paylaşırız.' },
      { title: 'İzlenebilir Kayıt', description: 'Her kontrol adımını belgeleyerek proje geçmişini şeffaf tutarız.' },
    ],
    image: IMG.c,
    imageAlt: 'Proje kontrol ve saha denetim süreci',
    ctaTitle: 'Projenizin kontrol sürecini konuşalım.',
    ctaSubtitle: 'İhtiyacınızı birlikte değerlendirelim ve doğru mühendislik çözümünü oluşturalım.',
  },
  {
    slug: 'taahhut',
    group: 'hizmet',
    title: 'Taahhüt & Uygulama',
    seoDescription: 'Projelerin sahada doğru, kontrollü ve mühendislik esaslarına uygun uygulanması.',
    tagline: 'Hizmetler / Taahhüt & Uygulama',
    heroTitle: 'Taahhüt & Uygulama',
    heroSubtitle:
      'Tasarımda alınan mühendislik kararlarını; saha organizasyonu, kalite kontrolü ve doğru koordinasyonla sahaya taşıyoruz.',
    features: [
      {
        icon: 'tabler:sitemap',
        title: 'Saha Organizasyonu',
        description: 'İş programı, kaynak planlaması ve saha ekip koordinasyonu.',
      },
      {
        icon: 'tabler:shield-check',
        title: 'Kalite ve İş Güvenliği Kontrolü',
        description: 'Uygulamanın kalite standartları ve iş güvenliği kurallarına uygunluğunun denetimi.',
      },
      {
        icon: 'tabler:network',
        title: 'Alt Yüklenici Koordinasyonu',
        description: 'Farklı disiplinlerdeki alt yüklenicilerin iş programına uygun yönetimi.',
      },
      {
        icon: 'tabler:circle-check',
        title: 'Test & Devreye Alma',
        description: 'Mekanik ve elektrik sistemlerinin testi ile devreye alma süreçlerinin yönetimi.',
      },
      {
        icon: 'tabler:file-description',
        title: 'As-Built Belgeleme',
        description: 'Uygulama sonrası güncel proje ve teknik dokümantasyonun hazırlanması.',
      },
      {
        icon: 'tabler:clipboard-check',
        title: 'Teslim Süreçleri',
        description: 'Projenin işverene eksiksiz ve belgeli biçimde teslim edilmesi.',
      },
    ],
    approachTagline: 'Yaklaşımımız',
    approachTitle: 'Tasarımı sahada da aynı bütünlükle sürdürmek.',
    approachItems: [
      {
        title: 'Mühendislik Esaslı Uygulama',
        description: 'Saha kararlarını da mühendislik hesap ve standartlarına dayandırırız.',
      },
      {
        title: 'Sürekli Koordinasyon',
        description: 'Tasarım ekibi ile saha ekibi arasındaki bilgi akışını kesintisiz tutarız.',
      },
      {
        title: 'Belgeli Teslim',
        description: 'Her teslim, test kayıtları ve as-built dokümantasyonuyla birlikte tamamlanır.',
      },
    ],
    image: IMG.d,
    imageAlt: 'Taahhüt ve saha uygulama süreçleri',
    ctaTitle: 'Uygulama sürecinizi konuşalım.',
    ctaSubtitle: 'İhtiyacınızı birlikte değerlendirelim ve doğru mühendislik çözümünü oluşturalım.',
  },
  {
    slug: 'sektorler',
    group: 'diger',
    title: 'Sektörler',
    seoDescription:
      'AKORT Mühendislik; sağlık, eğitim, konut, ticari, endüstriyel, veri merkezi, enerji ve kamu yapıları için mühendislik hizmeti sunar.',
    tagline: 'Sektörler',
    heroTitle: 'Farklı Yapı Tiplerine Uyumlanan Çözümler',
    heroSubtitle:
      'Her proje tipini kendi kullanım senaryosu, teknik riskleri ve işletme ihtiyaçları doğrultusunda ele alıyoruz.',
    features: [
      {
        icon: 'tabler:building-hospital',
        title: 'Hastaneler ve Sağlık Yapıları',
        description: 'Kritik MEP sistemleri ve kesintisiz işletme gerektiren teknik koordinasyon.',
      },
      {
        icon: 'tabler:school',
        title: 'Üniversiteler ve Eğitim Yapıları',
        description: 'Kampüs ölçeğinde mühendislik ve enerji verimliliği çözümleri.',
      },
      {
        icon: 'tabler:building-community',
        title: 'Konut',
        description: 'Konut ve rezidans projelerinde enerji verimli MEP sistemleri.',
      },
      {
        icon: 'tabler:building-store',
        title: 'Ticari Yapılar',
        description: 'AVM ve ticari yapılarda konfor ve enerji odaklı sistem tasarımı.',
      },
      {
        icon: 'tabler:briefcase',
        title: 'Ofisler',
        description: 'Yüksek katlı ofis yapılarında disiplinler arası koordinasyon.',
      },
      {
        icon: 'tabler:bed',
        title: 'Oteller',
        description: 'İşletme sürekliliği ve konfor odaklı mühendislik çözümleri.',
      },
      {
        icon: 'tabler:building-factory-2',
        title: 'Endüstriyel Yapılar',
        description: 'Üretim tesislerinde proses ihtiyaçlarına uygun teknik altyapı.',
      },
      {
        icon: 'tabler:server',
        title: 'Veri Merkezleri',
        description: 'Kesintisiz güç ve soğutma gerektiren kritik altyapı sistemleri.',
      },
      {
        icon: 'tabler:bolt',
        title: 'Enerji Tesisleri',
        description: 'Enerji üretim ve dağıtım tesislerinde mühendislik desteği.',
      },
      {
        icon: 'tabler:solar-panel-2',
        title: 'GES Projeleri',
        description: 'Güneş enerjisi yatırımlarında fizibiliteden uygulamaya teknik destek.',
      },
      {
        icon: 'tabler:building-bank',
        title: 'Kamu Yapıları',
        description: 'Kamu binalarında standartlara tam uyumlu mühendislik çözümleri.',
      },
      {
        icon: 'tabler:layout-grid',
        title: 'Karma Kullanımlı Projeler',
        description: 'Farklı kullanım senaryolarını tek yapıda dengeleyen bütünleşik tasarım.',
      },
    ],
    ctaTitle: 'Sektörünüze özel çözümü konuşalım.',
    ctaSubtitle: 'İhtiyacınızı birlikte değerlendirelim ve doğru mühendislik çözümünü oluşturalım.',
  },
];

function seedPages() {
  const count = db.select().from(pages).all().length;
  if (count > 0) return;

  for (const p of pageSeeds) {
    db.insert(pages)
      .values({
        slug: p.slug,
        group: p.group,
        title: p.title,
        seoDescription: p.seoDescription,
        tagline: p.tagline,
        heroTitle: p.heroTitle,
        heroSubtitle: p.heroSubtitle,
        features: p.features ?? [],
        approachTagline: p.approachTagline ?? null,
        approachTitle: p.approachTitle ?? null,
        approachItems: p.approachItems ?? [],
        image: p.image ?? null,
        imageAlt: p.imageAlt ?? null,
        ctaTitle: p.ctaTitle,
        ctaSubtitle: p.ctaSubtitle,
        updatedAt: new Date(),
      })
      .run();
  }
}

function seedSettings() {
  const existing = new Set(
    db
      .select({ key: settings.key })
      .from(settings)
      .all()
      .map((r) => r.key)
  );

  const configPath = path.join(root, 'src/config.yaml');
  const config = yaml.load(fs.readFileSync(configPath, 'utf8')) as {
    site: { name: string; site: string; googleSiteVerificationId?: string };
    metadata: { title: { default: string; template: string }; description: string };
    analytics?: { vendors?: { googleAnalytics?: { id?: string | null } } };
  };

  if (!existing.has('site')) {
    db.insert(settings)
      .values({
        key: 'site',
        value: {
          name: config.site.name,
          url: config.site.site,
          googleSiteVerificationId: config.site.googleSiteVerificationId ?? '',
          seoTitleDefault: config.metadata.title.default,
          seoTitleTemplate: config.metadata.title.template,
          seoDescription: config.metadata.description,
          googleAnalyticsId: config.analytics?.vendors?.googleAnalytics?.id ?? '',
        },
      })
      .run();
  }

  const navPath = path.join(root, 'src/navigation.data.yaml');
  const nav = yaml.load(fs.readFileSync(navPath, 'utf8')) as {
    header: unknown;
    footer: unknown;
    contact: { phone: string; email: string; address: string; linkedin: string; instagram: string };
  };

  if (!existing.has('contact')) {
    db.insert(settings).values({ key: 'contact', value: nav.contact }).run();
  }
  if (!existing.has('navigation')) {
    db.insert(settings)
      .values({ key: 'navigation', value: { header: nav.header, footer: nav.footer } })
      .run();
  }
  if (!existing.has('homepage')) {
    db.insert(settings)
      .values({
        key: 'homepage',
        value: {
          heroTagline: 'AKORT MÜHENDİSLİK',
          heroTitle: 'Uyumun Mühendisliği.',
          heroSubtitle:
            'Mekanik, elektrik, BIM, enerji ve yapı disiplinlerini aynı hedefte buluşturuyor; tasarımdan uygulamaya kadar bütünleşik mühendislik çözümleri sunuyoruz.',
          proofStats: [
            { value: '360°', label: 'Bütünleşik mühendislik yaklaşımı', icon: 'tabler:arrows-exchange' },
            { value: 'BIM', label: 'Koordinasyon ve dijital proje yönetimi', icon: 'tabler:box' },
            { value: 'MEP', label: 'Mekanik ve elektrik sistem entegrasyonu', icon: 'tabler:adjustments' },
          ],
          countStats: [
            { title: 'Mühendislik Disiplini', amount: '8+' },
            { title: 'Proje Yaklaşımı', amount: '360°' },
            { title: 'Dijital Koordinasyon', amount: 'BIM' },
            { title: 'Odak', amount: 'Tek Hedef' },
          ],
        },
      })
      .run();
  }
}

async function main() {
  await seedUsers();
  seedPosts();
  seedProjects();
  seedPages();
  seedSettings();
  console.log('Seed tamamlandı.');
}

main();
