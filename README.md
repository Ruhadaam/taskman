# Görev Yönetim Uygulaması

Bu uygulama, React Native ve TypeScript kullanılarak geliştirilmiş bir görev yönetim sistemidir. Firebase Authentication ve Firestore kullanılarak kullanıcı yönetimi ve veri depolama işlemleri gerçekleştirilmektedir.

## Özellikler

- Kullanıcı kimlik doğrulama (Authentication)
- Admin ve kullanıcı rolleri
- Görev oluşturma ve atama
- Görev durumu takibi (Beklemede, Tamamlandı, Gecikmiş)
- Görev bildirimleri
- Çoklu kullanıcı atama
- Son tarih takibi

## Kurulum

1. Projeyi klonlayın:

```bash
git clone [repo-url]
cd task-management-app
```

2. Bağımlılıkları yükleyin:

```bash
npm install
```

3. Firebase yapılandırması:

- Firebase Console'dan yeni bir proje oluşturun
- Authentication ve Firestore servislerini etkinleştirin
- Firebase yapılandırma bilgilerini `src/config/firebase.ts` dosyasına ekleyin

4. Uygulamayı başlatın:

```bash
npm start
```

## Kullanım

### Admin Paneli

- Kullanıcı yönetimi
- Görev oluşturma ve atama
- Tüm görevleri görüntüleme ve yönetme

### Kullanıcı Paneli

- Atanan görevleri görüntüleme
- Görev durumunu güncelleme
- Yeni görev oluşturma ve diğer kullanıcılara atama

## Teknolojiler

- React Native
- TypeScript
- Expo
- Firebase (Authentication & Firestore)
- React Navigation
- Expo Notifications
