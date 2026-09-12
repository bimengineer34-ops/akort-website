import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'Ana Sayfa',
      href: getPermalink('/'),
    },
    {
      text: 'Kurumsal',
      links: [
        { text: 'Hakkımızda', href: getPermalink('/hakkimizda') },
        { text: 'Neden AKORT?', href: getPermalink('/neden-akort') },
        { text: 'Çalışma Yaklaşımımız', href: getPermalink('/calisma-yaklasimimiz') },
        { text: 'Kalite Politikamız', href: getPermalink('/kalite-politikamiz') },
      ],
    },
    {
      text: 'Hizmetler',
      links: [
        { text: 'Mekanik Mühendislik', href: getPermalink('/mekanik-muhendislik') },
        { text: 'Elektrik Mühendisliği', href: getPermalink('/elektrik-muhendisligi') },
        { text: 'BIM & Dijital Mühendislik', href: getPermalink('/bim') },
        { text: 'Enerji & Enerji Verimliliği', href: getPermalink('/enerji-verimliligi') },
        { text: 'GES', href: getPermalink('/ges') },
        { text: 'Mimari', href: getPermalink('/mimari') },
        { text: 'Yapı & İnşaat', href: getPermalink('/yapi-insaat') },
        { text: 'Çelik Yapılar', href: getPermalink('/celik-yapilar') },
        { text: 'Teknik Danışmanlık', href: getPermalink('/teknik-danismanlik') },
        { text: 'Proje Kontrol', href: getPermalink('/proje-kontrol') },
        { text: 'Taahhüt & Uygulama', href: getPermalink('/taahhut') },
      ],
    },
    {
      text: 'Projeler',
      href: getPermalink('/projeler'),
    },
    {
      text: 'Sektörler',
      href: getPermalink('/sektorler'),
    },
    {
      text: 'Bilgi Merkezi',
      links: [
        { text: 'Tüm Yazılar', href: getBlogPermalink() },
        { text: 'BIM', href: getPermalink('bim', 'category') },
        { text: 'Enerji', href: getPermalink('enerji', 'category') },
        { text: 'MEP', href: getPermalink('mep', 'category') },
        { text: 'Mühendislik Notları', href: getPermalink('muehendislik-notlari', 'category') },
      ],
    },
    {
      text: 'İletişim',
      href: getPermalink('/iletisim'),
    },
  ],
  actions: [{ text: 'Teklif Al', href: getPermalink('/iletisim#teklif') }],
};

export const footerData = {
  links: [
    {
      title: 'Hizmetler',
      links: [
        { text: 'Mekanik Mühendislik', href: getPermalink('/mekanik-muhendislik') },
        { text: 'Elektrik Mühendisliği', href: getPermalink('/elektrik-muhendisligi') },
        { text: 'BIM & Dijital Mühendislik', href: getPermalink('/bim') },
        { text: 'Enerji & Enerji Verimliliği', href: getPermalink('/enerji-verimliligi') },
        { text: 'GES', href: getPermalink('/ges') },
        { text: 'Yapı & İnşaat', href: getPermalink('/yapi-insaat') },
        { text: 'Çelik Yapılar', href: getPermalink('/celik-yapilar') },
      ],
    },
    {
      title: 'Kurumsal',
      links: [
        { text: 'Hakkımızda', href: getPermalink('/hakkimizda') },
        { text: 'Neden AKORT?', href: getPermalink('/neden-akort') },
        { text: 'Projeler', href: getPermalink('/projeler') },
        { text: 'Sektörler', href: getPermalink('/sektorler') },
        { text: 'Bilgi Merkezi', href: getBlogPermalink() },
        { text: 'Kariyer', href: getPermalink('/kariyer') },
        { text: 'İletişim', href: getPermalink('/iletisim') },
      ],
    },
    {
      title: 'İletişim',
      links: [
        { text: 'Telefon: +90 (2xx) xxx xx xx', href: 'tel:+902xxxxxxxxx' },
        { text: 'E-posta: info@akortmuhendislik.com', href: 'mailto:info@akortmuhendislik.com' },
        { text: 'Adres: İstanbul, Türkiye', href: getPermalink('/iletisim') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'KVKK', href: getPermalink('/kvkk') },
    { text: 'Gizlilik Politikası', href: getPermalink('/gizlilik-politikasi') },
    { text: 'Çerez Politikası', href: getPermalink('/cerez-politikasi') },
  ],
  socialLinks: [
    { ariaLabel: 'LinkedIn', icon: 'tabler:brand-linkedin', href: 'https://www.linkedin.com/' },
    { ariaLabel: 'Instagram', icon: 'tabler:brand-instagram', href: 'https://www.instagram.com/' },
    { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
  ],
  footNote: `Copyright © ${new Date().getFullYear()} AKORT Mühendislik. Tüm hakları saklıdır.`,
};
