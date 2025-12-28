import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import {
    Heart,
    Zap,
    Shield,
    BarChart3,
    ArrowRight,
    CheckCircle,
    Tv,
    Target,
    Coffee,
    Wallet,
    QrCode,
    Volume2,
    Palette,
    Users,
    ChevronDown,
    Star,
    CreditCard,
    Globe,
    Bell,
    Gift,
    TrendingUp,
    MessageCircle,
} from 'lucide-react';

export default function Home() {
    const features = [
        {
            icon: BarChart3,
            title: 'Dashboard Analytics',
            description: 'Pantau statistik jajanan, pendapatan bulanan, dan jumlah supporter dalam satu dashboard yang intuitif.',
            color: 'from-blue-500 to-cyan-500',
        },
        {
            icon: Coffee,
            title: 'Produk Jajan',
            description: 'Buat item jajanan dengan nominal tetap seperti "Kopi" atau "Mie Ayam" dengan QR code unik.',
            color: 'from-primary-500 to-red-500',
        },
        {
            icon: Tv,
            title: 'Streaming Overlay',
            description: 'Alert box, goal bar, dan QR code overlay untuk OBS/streaming. Tampilkan jajanan real-time ke viewers.',
            color: 'from-purple-500 to-pink-500',
        },
        {
            icon: Volume2,
            title: 'Text-to-Speech',
            description: 'Jajanan akan dibacakan otomatis dengan TTS. Pilih suara dan atur kecepatan sesuai preferensimu.',
            color: 'from-orange-500 to-amber-500',
        },
        {
            icon: CreditCard,
            title: 'Multiple Payment',
            description: 'Terima pembayaran via QRIS, E-Wallet (GoPay, OVO, Dana), dan Transfer Bank dengan mudah.',
            color: 'from-indigo-500 to-blue-500',
        },
        {
            icon: Wallet,
            title: 'Instant Withdrawal',
            description: 'Tarik saldo kapan saja ke rekening bank pribadimu. Proses cepat dan transparan.',
            color: 'from-teal-500 to-green-500',
        },
        {
            icon: Palette,
            title: 'Customizable Profile',
            description: 'Personalisasi halaman jajaninmu dengan foto profil, bio, dan link sosial media.',
            color: 'from-pink-500 to-rose-500',
        },
    ];

    const streamingFeatures = [
        {
            icon: Bell,
            title: 'Alert Box',
            description: 'Tampilkan notifikasi jajanan dengan animasi menarik. Kustomisasi suara, durasi, dan tampilan alert.',
        },
        {
            icon: TrendingUp,
            title: 'Goal Progress Bar',
            description: 'Tunjukkan progress target danamu ke viewers. Update real-time saat ada pembelian.',
        },
        {
            icon: QrCode,
            title: 'QR Code Overlay',
            description: 'Tampilkan QR code di layar streaming agar viewers bisa langsung scan dan jajanin kreator.',
        },
        {
            icon: Volume2,
            title: 'Text-to-Speech',
            description: 'Setiap jajanan akan dibacakan otomatis. Viewers bisa mendengar pesan supporter lainnya.',
        },
    ];

    const steps = [
        {
            number: '1',
            title: 'Daftar Gratis',
            description: 'Buat akun dengan email atau Google. Tanpa biaya pendaftaran, tanpa komitmen.',
            icon: Users,
        },
        {
            number: '2',
            title: 'Setup Profil',
            description: 'Atur username unik, upload foto, tulis bio menarik, dan hubungkan akun bank.',
            icon: Palette,
        },
        {
            number: '3',
            title: 'Bagikan Link',
            description: 'Share link jajanin.id/username ke bio Instagram, deskripsi YouTube, atau di mana saja.',
            icon: Globe,
        },
        {
            number: '4',
            title: 'Terima Jajanan',
            description: 'Supporter kirim jajanan, dana masuk ke saldamu, dan kamu bisa withdraw kapan saja.',
            icon: Gift,
        },
    ];

    const faqs = [
        {
            question: 'Apakah Jajanin gratis digunakan?',
            answer: 'Ya! Pendaftaran dan penggunaan Jajanin sepenuhnya gratis. Kami hanya mengambil biaya admin kecil dari setiap transaksi.',
        },
        {
            question: 'Metode pembayaran apa saja yang tersedia?',
            answer: 'Supporter bisa membayar via QRIS (bisa discan dari aplikasi apapun), E-Wallet seperti GoPay, OVO, Dana, ShopeePay, dan Transfer Bank dari berbagai bank di Indonesia.',
        },
        {
            question: 'Bagaimana cara menarik saldo?',
            answer: 'Kamu bisa melakukan withdrawal kapan saja dari dashboard. Cukup isi informasi rekening bank dan ajukan penarikan. Dana akan diproses dalam 1-3 hari kerja.',
        },
        {
            question: 'Apakah bisa digunakan untuk streaming?',
            answer: 'Tentu! Jajanin menyediakan overlay khusus untuk streaming seperti Alert Box, Goal Progress Bar, dan QR Code yang bisa ditambahkan ke OBS atau software streaming lainnya.',
        },
        {
            question: 'Berapa minimum jajanan yang bisa diterima?',
            answer: 'Minimum jajanan adalah Rp 1.000. Tidak ada maksimum, supporter bebas memberikan dukungan sebesar apapun.',
        },
        {
            question: 'Apakah supporter perlu membuat akun?',
            answer: 'Tidak perlu! Supporter bisa langsung jajanin tanpa membuat akun. Cukup isi nama, email, pilih item, dan pesan dukungan.',
        },
    ];

    const testimonials = [
        {
            name: 'Budi Streamer',
            role: 'Gaming Streamer',
            content: 'Jajanin memudahkan viewers untuk support stream saya. Alert box-nya keren dan TTS-nya bikin interaksi makin seru!',
            avatar: 'ðŸŽ®',
        },
        {
            name: 'Sinta Creative',
            role: 'Content Creator',
            content: 'Dashboard-nya lengkap banget. Bisa tracking semua donasi dan langsung tau siapa aja yang udah support.',
            avatar: 'ðŸŽ¨',
        },
        {
            name: 'Adi Podcast',
            role: 'Podcaster',
            content: 'Quick Donate Items sangat membantu. Pendengar bisa langsung pilih "Traktir Kopi" tanpa perlu mikir nominal.',
            avatar: 'ðŸŽ™ï¸',
        },
    ];

    return (
        <main className="min-h-screen">
            <Navbar />

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary-600/5 via-transparent to-transparent" />
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary-600/20 rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto text-center relative z-10">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-600/10 border border-primary-600/30 mb-8">
                        <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                        <span className="text-primary-400 text-sm font-medium">
                            Platform #1 untuk Kreator Indonesia
                        </span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                        Terima Dukungan dari
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-red-400 to-orange-400">
                            Komunitas Kamu
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-10">
                        Platform jajanan terlengkap untuk content creator, streamer, dan kreator Indonesia.
                        <span className="hidden md:inline"> Dashboard lengkap, overlay streaming, dan multiple payment method.</span>
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                        <Link href="/register" className="btn-primary flex items-center gap-2 group text-lg px-8 py-4">
                            Mulai Sekarang - Gratis!
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                        </Link>
                        <Link href="/#features" className="btn-secondary text-lg px-8 py-4">
                            Lihat Semua Fitur
                        </Link>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-16">
                        <span className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            Gratis Selamanya
                        </span>
                        <span className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-500" />
                            Pembayaran Aman
                        </span>
                        <span className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            Setup 5 Menit
                        </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                        <div className="card py-6 px-4 text-center">
                            <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">10K+</p>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Kreator Aktif</p>
                        </div>
                        <div className="card py-6 px-4 text-center">
                            <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">500K+</p>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Jajanan Terkirim</p>
                        </div>
                        <div className="card py-6 px-4 text-center">
                            <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">5M+</p>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Total Jajanan (Rp)</p>
                        </div>
                        <div className="card py-6 px-4 text-center">
                            <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">99.9%</p>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Uptime Server</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1 rounded-full bg-primary-600/10 text-primary-400 text-sm font-medium mb-4">
                            Fitur Lengkap
                        </span>
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            Semua yang Kamu Butuhkan
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                            Dari dashboard analytics hingga streaming overlay, Jajanin punya semua fitur untuk memaksimalkan dukungan dari komunitasmu
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="card group hover:border-primary-600/50 transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Streaming/Creator Section */}
            <section className="py-20 px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-600/5 to-transparent" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <div>
                            <span className="inline-block px-4 py-1 rounded-full bg-purple-100 dark:bg-purple-600/10 text-purple-600 dark:text-purple-400 text-sm font-medium mb-4">
                                Untuk Streamer
                            </span>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                                Overlay Streaming yang
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400"> Powerful</span>
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
                                Tingkatkan interaksi dengan viewers melalui overlay yang bisa langsung ditambahkan ke OBS, Streamlabs, atau software streaming lainnya.
                            </p>

                            <div className="space-y-6">
                                {streamingFeatures.map((feature, index) => (
                                    <div key={index} className="flex gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                                            <feature.icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{feature.title}</h4>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Visual */}
                        <div className="relative">
                            <div className="card p-8 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-dark-800/80 dark:to-dark-900/80 border border-gray-200 dark:border-dark-700">
                                {/* Mock Alert Box */}
                                <div className="bg-gradient-to-r from-primary-100 to-red-100 dark:from-primary-600/20 dark:to-red-600/20 border border-primary-200 dark:border-primary-600/30 rounded-xl p-6 mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-red-500 flex items-center justify-center text-white text-2xl">
                                            â¤ï¸
                                        </div>
                                        <div>
                                            <p className="text-primary-600 dark:text-primary-400 font-bold text-lg">Budi Gamer</p>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">donasi Rp 50.000</p>
                                        </div>
                                    </div>
                                    <p className="text-gray-800 dark:text-white mt-4 italic">&quot;Semangat stream-nya bang! ðŸ”¥&quot;</p>
                                </div>

                                {/* Mock Goal Bar */}
                                <div className="bg-gray-200 dark:bg-dark-700/50 rounded-xl p-4 mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-800 dark:text-white font-semibold flex items-center gap-2">
                                            <Target className="w-4 h-4 text-green-500 dark:text-green-400" />
                                            Goal: Beli Mic Baru
                                        </span>
                                        <span className="text-green-600 dark:text-green-400 font-bold">75%</span>
                                    </div>
                                    <div className="h-4 bg-gray-300 dark:bg-dark-600 rounded-full overflow-hidden">
                                        <div className="h-full w-3/4 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" />
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">Rp 750.000 / Rp 1.000.000</p>
                                </div>

                                {/* Mock QR */}
                                <div className="flex items-center gap-4 bg-white rounded-xl p-4">
                                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                                        <QrCode className="w-12 h-12 text-gray-600" />
                                    </div>
                                    <div className="text-gray-800">
                                        <p className="font-bold">Scan untuk Donasi</p>
                                        <p className="text-sm text-gray-600">jajanin.id/streamer</p>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative elements */}
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-600/20 rounded-full blur-2xl" />
                            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-pink-600/20 rounded-full blur-2xl" />
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-20 px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-gray-100 via-white to-gray-50 dark:from-dark-900 dark:via-dark-950 dark:to-dark-900" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600/5 via-transparent to-red-600/5" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1 rounded-full bg-green-600/10 text-green-400 text-sm font-medium mb-4">
                            Mudah Banget
                        </span>
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            Mulai dalam 4 Langkah
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto text-lg">
                            Setup cepat, langsung terima donasi. Tidak perlu skill teknis apapun.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, index) => (
                            <div key={index} className="text-center relative">
                                {/* Connector Line */}
                                {index < steps.length - 1 && (
                                    <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary-600/50 to-transparent" />
                                )}

                                <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white relative z-10 shadow-lg shadow-primary-600/30">
                                    {step.number}
                                </div>
                                <div className="w-12 h-12 rounded-lg bg-primary-600/10 flex items-center justify-center mx-auto mb-4">
                                    <step.icon className="w-6 h-6 text-primary-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    {step.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1 rounded-full bg-yellow-600/10 text-yellow-400 text-sm font-medium mb-4">
                            Testimoni
                        </span>
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            Dipercaya Kreator Indonesia
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto text-lg">
                            Lihat apa kata mereka tentang pengalaman menggunakan Jajanin
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="card hover:border-primary-600/50 transition-all duration-300">
                                {/* Stars */}
                                <div className="flex gap-1 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                    ))}
                                </div>

                                <p className="text-gray-600 dark:text-gray-300 mb-6 italic">
                                    &quot;{testimonial.content}&quot;
                                </p>

                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-red-500 flex items-center justify-center text-2xl">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</p>
                                        <p className="text-gray-500 text-sm">{testimonial.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-20 px-4 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-600/5 to-transparent" />

                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1 rounded-full bg-blue-600/10 text-blue-400 text-sm font-medium mb-4">
                            FAQ
                        </span>
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            Pertanyaan Umum
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-lg">
                            Jawaban untuk pertanyaan yang sering ditanyakan
                        </p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div key={index} className="card hover:border-primary-600/30 transition">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-primary-600/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <MessageCircle className="w-4 h-4 text-primary-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                            {faq.question}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            {faq.answer}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits/Why Section */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <span className="inline-block px-4 py-1 rounded-full bg-red-600/10 text-red-400 text-sm font-medium mb-4">
                                Kenapa Jajanin?
                            </span>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                                Platform yang Dibuat untuk
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-red-400"> Kreator Lokal</span>
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
                                Kami memahami kebutuhan kreator Indonesia. Dari metode pembayaran lokal hingga fitur yang relevan dengan kebiasaan audience Indonesia.
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-6 h-6 text-green-500" />
                                    <span className="text-gray-700 dark:text-gray-300">Support QRIS dan semua e-wallet populer Indonesia</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-6 h-6 text-green-500" />
                                    <span className="text-gray-700 dark:text-gray-300">Withdrawal ke bank lokal manapun</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-6 h-6 text-green-500" />
                                    <span className="text-gray-700 dark:text-gray-300">Interface bahasa Indonesia yang user-friendly</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-6 h-6 text-green-500" />
                                    <span className="text-gray-700 dark:text-gray-300">Support TTS dengan suara Bahasa Indonesia</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-6 h-6 text-green-500" />
                                    <span className="text-gray-700 dark:text-gray-300">Customer support dalam Bahasa Indonesia</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="card p-6 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4">
                                    <Shield className="w-8 h-8 text-white" />
                                </div>
                                <h4 className="font-bold text-gray-900 dark:text-white mb-2">100% Aman</h4>
                                <p className="text-gray-500 text-sm">Enkripsi end-to-end & payment gateway terpercaya</p>
                            </div>
                            <div className="card p-6 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                                    <Zap className="w-8 h-8 text-white" />
                                </div>
                                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Super Cepat</h4>
                                <p className="text-gray-500 text-sm">Real-time notification & instant overlay update</p>
                            </div>
                            <div className="card p-6 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                                    <Heart className="w-8 h-8 text-white" />
                                </div>
                                <h4 className="font-bold text-gray-900 dark:text-white mb-2">User Friendly</h4>
                                <p className="text-gray-500 text-sm">Interface simpel yang mudah digunakan</p>
                            </div>
                            <div className="card p-6 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-white" />
                                </div>
                                <h4 className="font-bold text-gray-900 dark:text-white mb-2">24/7 Support</h4>
                                <p className="text-gray-500 text-sm">Tim support siap membantu kapanpun</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="card text-center p-12 relative overflow-hidden">
                        {/* Background Glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-red-600/10 to-transparent" />
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-600/30 rounded-full blur-3xl" />
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-red-600/20 rounded-full blur-3xl" />

                        <div className="relative z-10">
                            <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center mx-auto mb-6">
                                <Heart className="w-10 h-10 text-white" />
                            </div>

                            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                                Siap Menerima Dukungan?
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto text-lg">
                                Bergabung dengan ribuan kreator lainnya. Daftar gratis sekarang dan mulai terima donasi dari komunitasmu dalam hitungan menit.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                                <Link href="/register" className="btn-primary flex items-center gap-2 text-lg px-8 py-4 group">
                                    <Heart className="w-5 h-5" />
                                    Daftar Sekarang - Gratis!
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                                </Link>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                    Tanpa biaya pendaftaran
                                </span>
                                <span className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                    Tanpa kartu kredit
                                </span>
                                <span className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                    Setup dalam 5 menit
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 px-4 border-t border-gray-200 dark:border-dark-800 bg-gray-50 dark:bg-dark-950">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        {/* Brand */}
                        <div className="md:col-span-1">
                            <Link href="/" className="flex items-center gap-2 mb-4">
                                <Image
                                    src="/logo.png"
                                    alt="Jajanin"
                                    width={140}
                                    height={45}
                                    className="h-10 w-auto"
                                />
                            </Link>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                Platform donasi terlengkap untuk content creator dan streamer Indonesia.
                            </p>
                        </div>

                        {/* Product */}
                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Produk</h4>
                            <ul className="space-y-3 text-gray-600 dark:text-gray-400 text-sm">
                                <li><Link href="/#features" className="hover:text-primary-400 transition">Fitur</Link></li>
                                <li><Link href="/#how-it-works" className="hover:text-primary-400 transition">Cara Kerja</Link></li>
                                <li><Link href="/#faq" className="hover:text-primary-400 transition">FAQ</Link></li>
                                <li><Link href="/register" className="hover:text-primary-400 transition">Daftar</Link></li>
                            </ul>
                        </div>

                        {/* Support */}
                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Dukungan</h4>
                            <ul className="space-y-3 text-gray-600 dark:text-gray-400 text-sm">
                                <li><Link href="/contact" className="hover:text-primary-400 transition">Hubungi Kami</Link></li>
                                <li><Link href="/help" className="hover:text-primary-400 transition">Pusat Bantuan</Link></li>
                                <li><Link href="/docs" className="hover:text-primary-400 transition">Dokumentasi</Link></li>
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h4>
                            <ul className="space-y-3 text-gray-600 dark:text-gray-400 text-sm">
                                <li><Link href="/terms" className="hover:text-primary-400 transition">Syarat & Ketentuan</Link></li>
                                <li><Link href="/privacy" className="hover:text-primary-400 transition">Kebijakan Privasi</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-dark-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-gray-500">
                            Â© {new Date().getFullYear()} Jajanin. All rights reserved.
                        </p>
                        <p className="text-sm text-gray-500">
                            Made with â¤ï¸ in Indonesia
                        </p>
                    </div>
                </div>
            </footer>
        </main>
    );
}
