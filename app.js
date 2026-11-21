// =========================================================================
// MINI-DATABASE SIMULASI ZAKARA (LOCALSTORAGE ENGINE - PERSISTEN PER DEVICE)
// Mobile Pop-up Modal Portal Fix (v9) + Top-Bar Fix + Logo Favicon + Nominal Bebas
// =========================================================================

// Anti-Cache Otomatis: Memaksa browser HP (Safari/Chrome) selalu mengambil versi terbaru
(function enforceFreshVersion() {
    const CURRENT_VER = '2026.11.21.v9';
    const url = new URL(window.location.href);
    if (url.searchParams.get('v') !== CURRENT_VER) {
        url.searchParams.set('v', CURRENT_VER);
        window.location.replace(url.toString());
    }
})();

const ZAKARA_DB_KEY = 'zakara_mini_db_v2';
const NISAB_VALUE = 214030000;
const MIN_ZAKAT_DUE = Math.round(NISAB_VALUE * 0.025); // Rp 5.350.750

const DEFAULT_DB = {
    baseDanaMasuk: 14850000000,
    baseTersalurkan: 12420000000,
    baseHakAmil: 1217700000,
    baseSisaDana: 1212300000,
    baseMuzakki: 42810,
    baseMustahik: 31420,
    akads: {
        'Zakat Maal': { masuk: 8910000000, salur: 7550000000, amil: 668250000, sisa: 691750000 },
        'Infaq Produktif': { masuk: 4150000000, salur: 3420000000, amil: 373500000, sisa: 356500000 },
        'Wakaf Sarana': { masuk: 1790000000, salur: 1450000000, amil: 175950000, sisa: 164050000 }
    },
    campaigns: {
        'Pemberdayaan 50 Warung Barokah Dhuafa': { terkumpul: 212500000, target: 250000000, donatur: 420 },
        'Beasiswa Penuh 350 Santri Penghafal Quran': { terkumpul: 382500000, target: 450000000, donatur: 810 },
        'Pengadaan Sumur Bor & Sanitasi Air Bersih 3T': { terkumpul: 165600000, target: 180000000, donatur: 530 }
    },
    transactions: [],
    distributions: []
};

const PROGRAM_CATALOG = [
    { value: 'Penyaluran Zakat Maal (8 Asnaf)', label: 'Penyaluran Zakat Maal (8 Asnaf)', type: 'zakat' },
    { value: 'Pemberdayaan 50 Warung Barokah Dhuafa', label: 'Pemberdayaan 50 Warung Barokah Dhuafa (Infaq)', type: 'infaq' },
    { value: 'Beasiswa Penuh 350 Santri Penghafal Quran', label: 'Beasiswa Penuh 350 Santri Penghafal Quran (Infaq)', type: 'infaq' },
    { value: 'Bantuan Sembako & Pangan Dhuafa', label: 'Bantuan Sembako & Pangan Dhuafa (Infaq)', type: 'infaq' },
    { value: 'Pengadaan Sumur Bor & Sanitasi Air Bersih 3T', label: 'Pengadaan Sumur Bor & Sanitasi Air Bersih 3T (Wakaf Aset)', type: 'wakaf' },
    { value: 'Pembangunan Masjid & Fasilitas Umum', label: 'Pembangunan Masjid & Fasilitas Umum (Wakaf Aset)', type: 'wakaf' }
];

let lastNisabToastShown = false;
let modalContext = {
    isCampaignFixed: false,
    originalCampaignName: '',
    fromCalculator: false,
    calcAboveNisab: false
};

// =========================================================================
// 0. RESPONSIVE VIEWPORT FIX + TRUE FLOATING POP-UP MODAL + LOGO FAVICON
// =========================================================================
function applyResponsiveFixesAndFaviconLogo() {
    if (!document.getElementById('zakara-responsive-style')) {
        const style = document.createElement('style');
        style.id = 'zakara-responsive-style';
        style.textContent = `
            html {
                scroll-behavior: smooth;
            }
            body {
                min-height: 100dvh;
                max-width: 100vw;
            }
            img, svg, video, canvas {
                max-width: 100%;
                height: auto;
            }
            /* Paksa Pop-up Modal Donasi & Penyaluran SELALU mengambang di tengah layar HP maupun Desktop */
            #donation-modal:not(.hidden),
            #distribute-modal:not(.hidden) {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100vw !important;
                height: 100dvh !important;
                z-index: 99999 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 1rem !important;
                background-color: rgba(0, 0, 0, 0.65) !important;
                backdrop-filter: blur(4px) !important;
                -webkit-backdrop-filter: blur(4px) !important;
                overflow-y: auto !important;
            }
            #donation-modal > div,
            #distribute-modal > div {
                position: relative !important;
                width: 100% !important;
                max-width: 32rem !important;
                max-height: 88dvh !important;
                overflow-y: auto !important;
                margin: auto !important;
            }
            table {
                width: 100%;
            }
            @media (max-width: 768px) {
                body > header,
                body > nav,
                body > div.fixed,
                body > div.sticky,
                header.fixed,
                header.sticky,
                nav.fixed,
                nav.sticky {
                    position: relative !important;
                    top: auto !important;
                    left: auto !important;
                    right: auto !important;
                    width: 100% !important;
                }
                #mobile-nav-drawer {
                    position: relative !important;
                    top: auto !important;
                    width: 100% !important;
                    max-height: none !important;
                }
                main,
                body > section:first-of-type {
                    padding-top: 1.5rem !important;
                    margin-top: 0 !important;
                }
                footer,
                body {
                    padding-bottom: 5rem !important;
                }
                #toast-notification {
                    position: fixed !important;
                    left: 0.75rem !important;
                    right: 0.75rem !important;
                    bottom: 5rem !important;
                    z-index: 100000 !important;
                    max-width: calc(100vw - 1.5rem) !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Pindahkan #donation-modal langsung ke <body> agar tidak terjebak di dalam container bawah/footer
    const donationModal = document.getElementById('donation-modal');
    if (donationModal && donationModal.parentElement !== document.body) {
        document.body.appendChild(donationModal);
    }

    // Tutup modal otomatis jika user mengetuk area gelap di luar kotak pop-up
    if (donationModal && !donationModal.dataset.backdropBound) {
        donationModal.dataset.backdropBound = 'true';
        donationModal.addEventListener('click', (e) => {
            if (e.target === donationModal) {
                closeDonationModal();
            }
        });
    }

    function adjustForAnyFixedTopBar() {
        const isMobile = window.innerWidth <= 768;
        let maxFixedBottom = 0;

        document.querySelectorAll('header, nav, body > div').forEach(el => {
            if (el.id === 'donation-modal' || el.id === 'distribute-modal' || el.id === 'toast-notification') return;
            const st = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            if (st.position === 'fixed' && rect.top <= 10 && rect.height > 20 && rect.height < 300) {
                if (isMobile) {
                    el.style.setProperty('position', 'relative', 'important');
                    el.style.setProperty('top', 'auto', 'important');
                } else {
                    maxFixedBottom = Math.max(maxFixedBottom, Math.ceil(rect.bottom));
                }
            }
        });

        const mainEl = document.querySelector('main');
        if (!isMobile && maxFixedBottom > 0 && mainEl) {
            const curPt = parseFloat(window.getComputedStyle(mainEl).paddingTop) || 0;
            if (curPt < maxFixedBottom + 20) {
                mainEl.style.paddingTop = (maxFixedBottom + 24) + 'px';
            }
        }
    }

    adjustForAnyFixedTopBar();
    requestAnimationFrame(adjustForAnyFixedTopBar);
    window.addEventListener('resize', adjustForAnyFixedTopBar);

    // Sinkronkan logo pada Navbar agar sama persis dengan Favicon halaman
    const navBar = document.querySelector('header, nav');
    const faviconLink = document.querySelector('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
    const faviconHref = faviconLink ? faviconLink.getAttribute('href') : '';

    if (faviconHref && navBar) {
        const brandAnchor = navBar.querySelector('a[href*="index"], a');
        if (brandAnchor) {
            const existingImg = brandAnchor.querySelector('img');
            if (existingImg) {
                existingImg.src = faviconHref;
                existingImg.alt = 'Logo Zakara';
                existingImg.classList.add('object-contain');
            } else {
                const iconBox = brandAnchor.querySelector('div, span.material-symbols-outlined, svg');
                if (iconBox) {
                    const logoImg = document.createElement('img');
                    logoImg.src = faviconHref;
                    logoImg.alt = 'Logo Zakara';
                    logoImg.className = 'w-9 h-9 sm:w-10 sm:h-10 rounded-lg border-2 border-black bg-white object-contain p-0.5 shrink-0 shadow-[2px_2px_0px_#000000]';
                    iconBox.replaceWith(logoImg);
                }
            }
        }
    }
}

function getZakaraDB() {
    const raw = localStorage.getItem(ZAKARA_DB_KEY);
    if (!raw) {
        localStorage.setItem(ZAKARA_DB_KEY, JSON.stringify(DEFAULT_DB));
        return JSON.parse(JSON.stringify(DEFAULT_DB));
    }
    try {
        return JSON.parse(raw);
    } catch (e) {
        return JSON.parse(JSON.stringify(DEFAULT_DB));
    }
}

function saveZakaraDB(db) {
    localStorage.setItem(ZAKARA_DB_KEY, JSON.stringify(db));
}

function resetZakaraDB() {
    localStorage.removeItem(ZAKARA_DB_KEY);
    syncAllPagesWithDB();
    showToast('Database simulasi berhasil di-reset ke angka awal!');
}

function formatIDR(num) {
    return 'Rp ' + Math.round(num).toLocaleString('id-ID');
}

function formatPct(part, total) {
    if (!total) return '0,00%';
    return ((part / total) * 100).toFixed(2).replace('.', ',') + '%';
}

// Bebaskan semua input nominal agar menerima angka acak berapapun
function unlockFlexibleNumericInputs() {
    ['modal-amount-input', 'input-harta', 'dist-amount-input'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.setAttribute('step', '1');
            el.setAttribute('min', '1');
        }
    });
}

// 1. Toggle Mobile Drawer
function toggleMobileNav() {
    const drawer = document.getElementById('mobile-nav-drawer');
    const icon = document.getElementById('mobile-menu-icon');
    if (!drawer) return;
    drawer.classList.toggle('hidden');
    if (icon) {
        icon.textContent = drawer.classList.contains('hidden') ? 'menu' : 'close';
    }
}

// 2. Kalkulator Zakat Maal Interaktif
function initZakatCalculator() {
    const inputHarta = document.getElementById('input-harta');
    const zakatOutput = document.getElementById('zakat-output');
    const statusNisab = document.getElementById('status-nisab');
    const btnTunaikan = document.getElementById('btn-tunaikan-hitung');
    if (!inputHarta) return;

    inputHarta.setAttribute('step', '1');
    inputHarta.setAttribute('min', '0');

    function calculateZakat() {
        const val = parseFloat(inputHarta.value) || 0;
        if (val >= NISAB_VALUE) {
            const zakatDue = Math.round(val * 0.025);
            if (zakatOutput) {
                zakatOutput.textContent = formatIDR(zakatDue);
                zakatOutput.className = "font-headline-md text-headline-md text-secondary font-bold";
            }
            if (statusNisab) {
                statusNisab.innerHTML = '<span class="material-symbols-outlined text-sm font-bold">check_circle</span><span>Melebihi Nisab (Wajib Zakat Maal 2.5%)</span>';
                statusNisab.className = "inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm uppercase font-bold mt-1";
            }
            if (btnTunaikan) {
                btnTunaikan.innerHTML = '<span>Tunaikan Zakat Maal</span><span class="material-symbols-outlined text-[18px] font-bold">arrow_forward</span>';
            }
        } else {
            if (zakatOutput) {
                zakatOutput.textContent = "Rp 0";
                zakatOutput.className = "font-headline-md text-headline-md text-outline font-bold";
            }
            if (statusNisab) {
                const kurang = Math.max(0, NISAB_VALUE - val);
                statusNisab.innerHTML = '<span class="material-symbols-outlined text-sm font-bold">info</span><span>Belum Mencapai Nisab (Kurang ' + formatIDR(kurang) + ') - Dianjurkan Infaq / Wakaf</span>';
                statusNisab.className = "inline-flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm uppercase font-bold mt-1";
            }
            if (btnTunaikan) {
                btnTunaikan.innerHTML = '<span>Salurkan</span><span class="material-symbols-outlined text-[18px] font-bold">arrow_forward</span>';
            }
        }
    }

    inputHarta.addEventListener('input', calculateZakat);
    calculateZakat();

    if (btnTunaikan) {
        btnTunaikan.onclick = function () {
            const val = parseFloat(inputHarta.value) || 0;
            const isAboveNisab = val >= NISAB_VALUE;
            const nominal = isAboveNisab ? Math.round(val * 0.025) : 100000;
            openDonationModal(
                '',
                nominal,
                '',
                { fromCalculator: true, isAboveNisab: isAboveNisab }
            );
        };
    }
}

// 3. Sinkronisasi Dua Arah Program <-> Akad Syariah & Nisab
function getProgramType(progValue) {
    const found = PROGRAM_CATALOG.find(p => p.value === progValue);
    if (found) return found.type;
    if (/sumur|masjid|wakaf|sanitasi|gedung|tanah/i.test(progValue)) return 'wakaf';
    if (/zakat/i.test(progValue)) return 'zakat';
    return 'infaq';
}

function isEligibleForZakat(nominal) {
    if (modalContext.fromCalculator) return modalContext.calcAboveNisab;
    return nominal >= MIN_ZAKAT_DUE;
}

function syncProgramFromAkadChange() {
    const progEl = document.getElementById('modal-program-name');
    const amtInput = document.getElementById('modal-amount-input');
    const akadSelect = document.getElementById('modal-akad-select');
    if (!progEl || !amtInput || !akadSelect) return;

    const chosenAkad = akadSelect.value;
    const nominal = parseFloat(amtInput.value) || 0;
    const zakatEligible = isEligibleForZakat(nominal);

    if (modalContext.isCampaignFixed) {
        if (chosenAkad === 'Zakat Maal' && zakatEligible) {
            progEl.value = `Penyaluran Zakat Maal (8 Asnaf) — ${modalContext.originalCampaignName}`;
        } else {
            progEl.value = modalContext.originalCampaignName;
        }
        return;
    }

    if (chosenAkad === 'Zakat Maal' && zakatEligible) {
        progEl.value = 'Penyaluran Zakat Maal (8 Asnaf)';
        applyDonationRules({ autoSwitchToZakat: false, triggerPopup: false });
    } else if (chosenAkad === 'Infaq Produktif') {
        if (!progEl.value || getProgramType(progEl.value) !== 'infaq') {
            progEl.value = 'Pemberdayaan 50 Warung Barokah Dhuafa';
        }
        applyDonationRules({ autoSwitchToZakat: false, triggerPopup: false });
    } else if (chosenAkad === 'Wakaf Sarana') {
        if (!progEl.value || getProgramType(progEl.value) !== 'wakaf') {
            progEl.value = 'Pengadaan Sumur Bor & Sanitasi Air Bersih 3T';
        }
        applyDonationRules({ autoSwitchToZakat: false, triggerPopup: false });
    }
}

function applyDonationRules({ autoSwitchToZakat = false, triggerPopup = false } = {}) {
    const progEl = document.getElementById('modal-program-name');
    const amtInput = document.getElementById('modal-amount-input');
    const akadSelect = document.getElementById('modal-akad-select');
    if (!progEl || !amtInput || !akadSelect) return;

    const nominal = parseFloat(amtInput.value) || 0;
    const zakatEligible = isEligibleForZakat(nominal);

    if (progEl.tagName === 'SELECT') {
        const zakatProgOpt = Array.from(progEl.options).find(o => o.value === 'Penyaluran Zakat Maal (8 Asnaf)');
        if (zakatProgOpt) {
            zakatProgOpt.disabled = !zakatEligible;
            zakatProgOpt.textContent = zakatEligible
                ? 'Penyaluran Zakat Maal (8 Asnaf)'
                : 'Penyaluran Zakat Maal (Nonaktif - Di Bawah Nisab)';
        }

        if (zakatEligible && autoSwitchToZakat) {
            progEl.value = 'Penyaluran Zakat Maal (8 Asnaf)';
        } else if (!zakatEligible && progEl.value === 'Penyaluran Zakat Maal (8 Asnaf)') {
            progEl.value = '';
        }
    } else if (modalContext.isCampaignFixed) {
        if (!zakatEligible) {
            progEl.value = modalContext.originalCampaignName;
        }
    }

    if (zakatEligible) {
        if (triggerPopup && !lastNisabToastShown) {
            lastNisabToastShown = true;
            showToast('Memenuhi batas Nisab! Opsi Zakat Maal aktif (atau pilih program Infaq/Wakaf sesuai kebutuhan).');
        }
    } else {
        lastNisabToastShown = false;
    }

    const selectedProg = modalContext.isCampaignFixed ? modalContext.originalCampaignName : progEl.value;
    const optPlaceholder = Array.from(akadSelect.options).find(o => o.value === '');
    const optZakat = Array.from(akadSelect.options).find(o => o.value === 'Zakat Maal');
    const optInfaq = Array.from(akadSelect.options).find(o => o.value === 'Infaq Produktif');
    const optWakaf = Array.from(akadSelect.options).find(o => o.value === 'Wakaf Sarana');

    if (!selectedProg) {
        if (optPlaceholder) optPlaceholder.disabled = false;
        if (optZakat) {
            optZakat.disabled = !zakatEligible;
            optZakat.textContent = zakatEligible ? 'Zakat Maal (2.5% - 8 Asnaf)' : 'Zakat Maal (Nonaktif - Di Bawah Nisab)';
        }
        if (optInfaq) {
            optInfaq.disabled = false;
            optInfaq.textContent = 'Infaq Produktif (Non-Aset / Pemberdayaan)';
        }
        if (optWakaf) {
            optWakaf.disabled = false;
            optWakaf.textContent = 'Wakaf Sarana (Aset Berkelanjutan)';
        }
        akadSelect.value = '';
        return;
    }

    if (optPlaceholder) optPlaceholder.disabled = true;

    const progType = getProgramType(selectedProg);

    if (progType === 'zakat') {
        if (optZakat) {
            optZakat.disabled = !zakatEligible;
            optZakat.textContent = 'Zakat Maal (2.5% - 8 Asnaf)';
        }
        if (optInfaq) {
            optInfaq.disabled = modalContext.isCampaignFixed;
            optInfaq.textContent = 'Infaq Produktif (Non-Aset / Pemberdayaan)';
        }
        if (optWakaf) {
            optWakaf.disabled = modalContext.isCampaignFixed;
            optWakaf.textContent = 'Wakaf Sarana (Aset Berkelanjutan)';
        }
        akadSelect.value = zakatEligible ? 'Zakat Maal' : '';
    } else if (progType === 'wakaf') {
        if (optWakaf) {
            optWakaf.disabled = false;
            optWakaf.textContent = 'Wakaf Sarana (Aset Berkelanjutan)';
        }
        if (optInfaq) {
            optInfaq.disabled = true;
            optInfaq.textContent = 'Infaq Produktif (Khusus Non-Aset / Konsumtif)';
        }
        if (optZakat) {
            optZakat.disabled = !zakatEligible;
            optZakat.textContent = zakatEligible ? 'Zakat Maal (2.5% - 8 Asnaf)' : 'Zakat Maal (Nonaktif - Di Bawah Nisab)';
        }
        if (akadSelect.value !== 'Zakat Maal' || !zakatEligible) {
            akadSelect.value = 'Wakaf Sarana';
        }
    } else {
        if (optInfaq) {
            optInfaq.disabled = false;
            optInfaq.textContent = 'Infaq Produktif (Non-Aset / Pemberdayaan)';
        }
        if (optWakaf) {
            optWakaf.disabled = true;
            optWakaf.textContent = 'Wakaf Sarana (Khusus Program Aset Abadi)';
        }
        if (optZakat) {
            optZakat.disabled = !zakatEligible;
            optZakat.textContent = zakatEligible ? 'Zakat Maal (2.5% - 8 Asnaf)' : 'Zakat Maal (Nonaktif - Di Bawah Nisab)';
        }
        if (akadSelect.value !== 'Zakat Maal' || !zakatEligible) {
            akadSelect.value = 'Infaq Produktif';
        }
    }
}

function setupDonationModalField(isCampaignFixed, fixedCampaignName) {
    const progEl = document.getElementById('modal-program-name');
    const amtInput = document.getElementById('modal-amount-input');
    const akadSelect = document.getElementById('modal-akad-select');
    if (!progEl || !amtInput || !akadSelect) return;

    amtInput.setAttribute('step', '1');
    amtInput.setAttribute('min', '1');

    akadSelect.required = true;
    akadSelect.innerHTML = `
        <option value="" disabled selected>-- Pilih Jenis Akad Syariahmu --</option>
        <option value="Zakat Maal">Zakat Maal (2.5% - 8 Asnaf)</option>
        <option value="Infaq Produktif">Infaq Produktif (Non-Aset / Pemberdayaan)</option>
        <option value="Wakaf Sarana">Wakaf Sarana (Aset Berkelanjutan)</option>
    `;

    akadSelect.onchange = () => {
        syncProgramFromAkadChange();
    };

    if (!amtInput.dataset.nisabBound) {
        amtInput.dataset.nisabBound = 'true';
        amtInput.addEventListener('input', () => {
            modalContext.fromCalculator = false;
            const nominal = parseFloat(amtInput.value) || 0;
            const becameEligible = nominal >= MIN_ZAKAT_DUE && !lastNisabToastShown;
            applyDonationRules({
                autoSwitchToZakat: becameEligible && !modalContext.isCampaignFixed,
                triggerPopup: true
            });
        });
    }

    if (isCampaignFixed) {
        if (progEl.tagName === 'SELECT') {
            const inputFixed = document.createElement('input');
            inputFixed.id = 'modal-program-name';
            inputFixed.type = 'text';
            inputFixed.readOnly = true;
            progEl.replaceWith(inputFixed);
        }
        const updatedProg = document.getElementById('modal-program-name');
        updatedProg.value = fixedCampaignName;
        updatedProg.readOnly = true;
        updatedProg.className = 'w-full bg-surface-container border-2 border-black rounded-lg px-space-sm py-2 font-body-md text-body-md font-bold text-black';
    } else {
        if (progEl.tagName === 'INPUT') {
            const selectProg = document.createElement('select');
            selectProg.id = 'modal-program-name';
            progEl.replaceWith(selectProg);
        }
        const updatedSelect = document.getElementById('modal-program-name');
        updatedSelect.required = true;
        updatedSelect.className = 'w-full bg-surface-container-lowest border-2 border-black rounded-lg px-space-sm py-2 font-body-md text-body-md font-semibold text-black';
        updatedSelect.innerHTML = `<option value="" disabled selected>-- Pilih Program Pilihanmu --</option>` +
            PROGRAM_CATALOG.map(p => `<option value="${p.value}">${p.label}</option>`).join('');
        updatedSelect.value = '';

        updatedSelect.onchange = () => {
            akadSelect.value = '';
            applyDonationRules({ autoSwitchToZakat: false, triggerPopup: false });
        };
    }
}

function openDonationModal(programName, defaultAmount, defaultAkad, options = {}) {
    const isSpecificCampaign = Boolean(programName && Object.prototype.hasOwnProperty.call(DEFAULT_DB.campaigns, programName));
    const isCampaignFixed = isSpecificCampaign && !options.fromCalculator;

    modalContext = {
        isCampaignFixed: isCampaignFixed,
        originalCampaignName: isCampaignFixed ? programName : '',
        fromCalculator: Boolean(options.fromCalculator),
        calcAboveNisab: Boolean(options.isAboveNisab)
    };

    setupDonationModalField(isCampaignFixed, programName);

    const modal = document.getElementById('donation-modal');
    const progEl = document.getElementById('modal-program-name');
    const amtInput = document.getElementById('modal-amount-input');
    const akadSelect = document.getElementById('modal-akad-select');

    if (amtInput && defaultAmount) {
        amtInput.value = defaultAmount;
    }

    const zakatEligible = isEligibleForZakat(parseFloat(amtInput?.value) || 0);

    if (!isCampaignFixed && zakatEligible && progEl) {
        progEl.value = 'Penyaluran Zakat Maal (8 Asnaf)';
    }

    lastNisabToastShown = false;
    applyDonationRules({
        autoSwitchToZakat: !isCampaignFixed && zakatEligible,
        triggerPopup: true
    });

    if (akadSelect && defaultAkad && isCampaignFixed) {
        const targetOpt = Array.from(akadSelect.options).find(o => o.value === defaultAkad);
        if (targetOpt && !targetOpt.disabled) {
            akadSelect.value = defaultAkad;
        }
    }

    if (modal) {
        // Pastikan modal berada langsung di dalam <body> agar tidak pernah merosot di atas footer pada HP
        if (modal.parentElement !== document.body) {
            document.body.appendChild(modal);
        }
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeDonationModal() {
    const modal = document.getElementById('donation-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    document.body.style.overflow = '';
}

function submitDonationModal(e) {
    e.preventDefault();
    const progEl = document.getElementById('modal-program-name');
    const akadSelect = document.getElementById('modal-akad-select');
    const program = progEl ? progEl.value.trim() : '';
    const akad = akadSelect ? akadSelect.value : '';

    if (!program) {
        showToast('Silakan pilih Program Pilihanmu terlebih dahulu!');
        return;
    }
    if (!akad) {
        showToast('Silakan pilih Jenis Akad Syariahmu terlebih dahulu!');
        return;
    }

    const amt = Math.round(parseFloat(document.getElementById('modal-amount-input').value)) || 0;
    if (amt <= 0) {
        showToast('Masukkan nominal donasi lebih dari Rp 0!');
        return;
    }

    const donorName = document.getElementById('modal-donor-name').value.trim() || 'Hamba Allah';

    const db = getZakaraDB();

    db.baseDanaMasuk += amt;
    db.baseSisaDana += amt;
    db.baseMuzakki += 1;

    if (db.akads[akad]) {
        db.akads[akad].masuk += amt;
        db.akads[akad].sisa += amt;
    }

    const targetCampaignKey = modalContext.isCampaignFixed ? modalContext.originalCampaignName : program;
    if (db.campaigns[targetCampaignKey]) {
        db.campaigns[targetCampaignKey].terkumpul += amt;
        db.campaigns[targetCampaignKey].donatur += 1;
    }

    const now = new Date();
    const jam = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const tgl = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const trxCode = '#TRX-' + (88492 + db.transactions.length);
    const bszCode = 'BSZ-2026-11-' + Math.floor(1000 + Math.random() * 9000);

    db.transactions.unshift({
        trx: trxCode,
        waktu: `${jam} WIB, ${tgl}`,
        nama: donorName,
        akad: akad,
        program: program,
        nominal: amt,
        bsz: bszCode
    });

    saveZakaraDB(db);
    syncAllPagesWithDB();
    closeDonationModal();

    showToast(`Alhamdulillah! ${akad} ${formatIDR(amt)} untuk "${program}" (${trxCode}) berhasil dicatat!`);
}

// 4. Simulasi Penyaluran Dana Kas ke Mustahik (Siklus Hilir ZISWAF)
function injectDistributionControls() {
    const neracaBalanceBox = document.getElementById('neraca-balance-status')?.closest('.bg-secondary-container');
    if (!neracaBalanceBox || document.getElementById('btn-simulasi-salur')) return;

    const btnWrapper = document.createElement('div');
    btnWrapper.className = 'flex flex-wrap items-center gap-2 shrink-0';
    btnWrapper.innerHTML = `
        <button type="button" id="btn-simulasi-salur" onclick="openDistributeModal()" class="px-4 py-2.5 bg-primary-container text-black font-label-md text-label-md uppercase border-2 border-black rounded-xl shadow-[3px_3px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[18px] font-bold">send_money</span>
            <span>Simulasikan Penyaluran Kas</span>
        </button>
        <button type="button" onclick="resetZakaraDB()" title="Kembalikan angka ke awal" class="px-3 py-2.5 bg-white text-black font-label-sm text-label-sm uppercase border-2 border-black rounded-xl shadow-[2px_2px_0px_#000000] hover:bg-error-container transition-all">
            Reset
        </button>
    `;
    neracaBalanceBox.appendChild(btnWrapper);

    const distModal = document.createElement('div');
    distModal.id = 'distribute-modal';
    distModal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs hidden p-margin-mobile';
    distModal.innerHTML = `
        <div class="bg-surface-container-lowest border-2 border-black rounded-xl p-space-lg max-w-lg w-full shadow-[8px_8px_0px_#000000] relative">
            <div class="flex items-center justify-between pb-space-sm border-b-2 border-black mb-space-md">
                <span class="font-label-md text-label-md uppercase tracking-wider text-black">Simulasi Penyaluran Kas ke Mustahik</span>
                <button type="button" onclick="closeDistributeModal()" class="w-8 h-8 rounded-lg border-2 border-black bg-surface-container hover:bg-error-container flex items-center justify-center">
                    <span class="material-symbols-outlined text-[18px] font-bold">close</span>
                </button>
            </div>
            <form onsubmit="submitDistributeModal(event)" class="space-y-space-sm">
                <div>
                    <label class="font-label-sm text-label-sm uppercase text-on-surface-variant block mb-1">Sumber Kas Akad Syariah</label>
                    <select id="dist-akad-select" class="w-full bg-surface-container-lowest border-2 border-black rounded-lg px-space-sm py-2 font-body-md text-body-md">
                        <option value="Zakat Maal">Kas Zakat Maal &amp; Fitrah (8 Asnaf)</option>
                        <option value="Infaq Produktif">Kas Infaq &amp; Sedekah Kemanusiaan</option>
                        <option value="Wakaf Sarana">Kas Wakaf Produktif &amp; Sarana</option>
                    </select>
                </div>
                <div>
                    <label class="font-label-sm text-label-sm uppercase text-on-surface-variant block mb-1">Tujuan Penyaluran Program</label>
                    <select id="dist-target-select" class="w-full bg-surface-container-lowest border-2 border-black rounded-lg px-space-sm py-2 font-body-md text-body-md">
                        <option value="Modal Usaha 50 Warung Barokah (Asnaf Miskin)">Modal Usaha 50 Warung Barokah (Asnaf Miskin)</option>
                        <option value="Beasiswa SPP 350 Santri Quran (Fisabilillah)">Beasiswa SPP 350 Santri Quran (Fisabilillah)</option>
                        <option value="Paket Sembako Lansia Dhuafa (Asnaf Fakir)">Paket Sembako Lansia Dhuafa (Asnaf Fakir)</option>
                        <option value="Sumur Bor &amp; Sanitasi Air Bersih 3T">Sumur Bor &amp; Sanitasi Air Bersih 3T</option>
                    </select>
                </div>
                <div>
                    <label class="font-label-sm text-label-sm uppercase text-on-surface-variant block mb-1">Nominal Disalurkan (IDR)</label>
                    <input id="dist-amount-input" type="number" min="1" step="1" required value="500000" class="w-full bg-surface-container-lowest border-2 border-black rounded-lg px-space-sm py-2 font-title-lg text-title-lg"/>
                </div>
                <button type="submit" class="w-full bg-secondary-container text-black font-title-lg text-title-lg uppercase border-2 border-black rounded-xl py-3 shadow-[4px_4px_0px_#000000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                    Eksekusi Penyaluran &amp; Update Neraca
                </button>
            </form>
        </div>
    `;
    document.body.appendChild(distModal);
}

function openDistributeModal() {
    const modal = document.getElementById('distribute-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeDistributeModal() {
    const modal = document.getElementById('distribute-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    document.body.style.overflow = '';
}

function submitDistributeModal(e) {
    e.preventDefault();
    const akad = document.getElementById('dist-akad-select').value;
    const tujuan = document.getElementById('dist-target-select').value;
    const amt = Math.round(parseFloat(document.getElementById('dist-amount-input').value)) || 0;

    if (amt <= 0) {
        showToast('Masukkan nominal penyaluran lebih dari Rp 0!');
        return;
    }

    const db = getZakaraDB();
    if (amt > db.baseSisaDana) {
        showToast('Saldo Kas Sisa tidak mencukupi untuk nominal penyaluran tersebut!');
        return;
    }

    db.baseSisaDana -= amt;
    db.baseTersalurkan += amt;
    db.baseMustahik += 1;

    if (db.akads[akad]) {
        db.akads[akad].salur += amt;
        db.akads[akad].sisa = Math.max(0, db.akads[akad].sisa - amt);
    }

    const now = new Date();
    const tgl = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    db.distributions.unshift({
        bast: 'BAST-2026-' + Math.floor(100 + Math.random() * 900),
        waktu: tgl,
        akad: akad,
        tujuan: tujuan,
        nominal: amt
    });

    saveZakaraDB(db);
    syncAllPagesWithDB();
    closeDistributeModal();
    showToast(`Penyaluran ${formatIDR(amt)} ke "${tujuan}" berhasil dicatat! Sisa Kas berkurang & Tersalurkan bertambah.`);
}

// 5. Sinkronisasi Otomatis Tampilan Semua Halaman dari Mini-Database
function syncAllPagesWithDB() {
    const db = getZakaraDB();

    // --- HALAMAN 1: BERANDA (index.html) ---
    const berandaTotal = document.getElementById('beranda-total-dana');
    if (berandaTotal) {
        berandaTotal.textContent = formatIDR(db.baseDanaMasuk);
        const card1Desc = berandaTotal.nextElementSibling;
        if (card1Desc) {
            card1Desc.textContent = `Total dana terhimpun dari ${db.baseMuzakki.toLocaleString('id-ID')}+ muzakki dengan pemisahan akad syariah realtime.`;
        }
        const statCards = berandaTotal.closest('.grid')?.children;
        if (statCards && statCards[1]) {
            const mustahikHeadline = statCards[1].querySelector('.font-headline-md');
            if (mustahikHeadline) {
                mustahikHeadline.textContent = `${db.baseMustahik.toLocaleString('id-ID')} Jiwa Mustahik`;
            }
        }
    }

    // --- HALAMAN 4: DONASI & KAMPANYE (donasi.html) ---
    const pageDonasi = document.getElementById('page-donasi');
    if (pageDonasi) {
        pageDonasi.querySelectorAll('article').forEach(card => {
            const titleEl = card.querySelector('h3');
            if (!titleEl) return;
            const title = titleEl.textContent.trim();
            const camp = db.campaigns[title];
            if (camp) {
                const pct = Math.min(100, Math.round((camp.terkumpul / camp.target) * 100));
                const badgePct = card.querySelector('span.bg-white');
                if (badgePct) badgePct.textContent = `${pct}% TERCAPAI`;

                const terkumpulEl = card.querySelector('.mt-space-md.bg-surface-container .flex.justify-between.items-baseline.mb-1 span:last-child');
                if (terkumpulEl) terkumpulEl.textContent = formatIDR(camp.terkumpul);

                const barEl = card.querySelector('.bg-secondary-container.border-r-2');
                if (barEl) barEl.style.width = `${pct}%`;

                const footerStats = card.querySelectorAll('.flex.justify-between.mt-1 span');
                if (footerStats.length >= 2) {
                    footerStats[1].textContent = `${camp.donatur.toLocaleString('id-ID')} Donatur`;
                }
            }
        });
    }

    // --- HALAMAN 5: LAPORAN & NERACA (laporan.html) ---
    const neracaMasuk = document.getElementById('neraca-masuk');
    const neracaSisa = document.getElementById('neraca-sisa');
    const neracaStatus = document.getElementById('neraca-balance-status');
    if (neracaMasuk && neracaSisa && neracaStatus) {
        const totalMasuk = db.baseDanaMasuk;
        const totalSalur = db.baseTersalurkan;
        const totalAmil = db.baseHakAmil;
        const totalSisa = db.baseSisaDana;

        neracaMasuk.textContent = formatIDR(totalMasuk);
        neracaSisa.textContent = formatIDR(totalSisa);

        const cards = neracaMasuk.closest('.grid').children;
        if (cards.length === 4) {
            cards[1].querySelector('.font-mono.font-bold').textContent = formatIDR(totalSalur);
            cards[1].querySelector('span.font-mono').textContent = formatPct(totalSalur, totalMasuk);
            cards[2].querySelector('span.font-mono').textContent = formatPct(totalAmil, totalMasuk);
            cards[3].querySelector('span.font-mono').textContent = formatPct(totalSisa, totalMasuk);
        }

        neracaStatus.textContent = `NERACA SEIMBANG & TEREKONSILIASI (BALANCE: ${formatIDR(totalMasuk)})`;
        const detailFormula = neracaStatus.nextElementSibling;
        if (detailFormula) {
            detailFormula.textContent = `${formatIDR(totalSalur)} + ${formatIDR(totalAmil)} + ${formatIDR(totalSisa)} = ${formatIDR(totalMasuk)} (Selisih Rp 0).`;
        }
    }

    // Update Tabel Pemisahan Saldo per Akad Syariah (laporan.html)
    const tabelSegregasi = document.getElementById('tabel-segregasi');
    if (tabelSegregasi) {
        const rows = tabelSegregasi.querySelectorAll('tbody tr');
        const rowMap = [
            { idx: 0, key: 'Zakat Maal' },
            { idx: 1, key: 'Infaq Produktif' },
            { idx: 2, key: 'Wakaf Sarana' }
        ];
        rowMap.forEach(({ idx, key }) => {
            if (rows[idx] && db.akads[key]) {
                const cells = rows[idx].querySelectorAll('td');
                if (cells.length >= 5) {
                    cells[1].textContent = formatIDR(db.akads[key].masuk);
                    cells[2].textContent = formatIDR(db.akads[key].salur);
                    cells[4].textContent = formatIDR(db.akads[key].sisa);
                }
            }
        });
    }

    // Render Log Transaksi Masuk (laporan.html)
    const tbody = document.getElementById('donor-rekap-tbody');
    if (tbody) {
        tbody.querySelectorAll('.dynamic-trx-row').forEach(el => el.remove());
        db.transactions.slice().reverse().forEach(item => {
            const tr = document.createElement('tr');
            tr.className = 'bg-secondary-container/25 dynamic-trx-row';
            tr.innerHTML = `
                <td class="p-space-md font-headline-sm text-headline-sm text-black border-r-2 border-black font-bold">${item.trx}</td>
                <td class="p-space-md text-on-surface border-r-2 border-black">${item.waktu}</td>
                <td class="p-space-md font-bold text-black border-r-2 border-black">${item.nama}</td>
                <td class="p-space-md border-r-2 border-black"><span class="bg-primary-container border border-black px-2 py-0.5 rounded font-label-sm text-label-sm">${item.akad}</span></td>
                <td class="p-space-md font-title-lg text-title-lg font-bold text-black border-r-2 border-black">${formatIDR(item.nominal)}</td>
                <td class="p-space-md font-label-sm text-label-sm text-on-surface-variant font-mono">${item.bsz}</td>
            `;
            tbody.prepend(tr);
        });
    }
}

// 6. Filter Galeri Bukti 3 Filantropi (Halaman 6)
function filterGallery(category) {
    document.querySelectorAll('.gal-tab-btn').forEach(btn => {
        btn.classList.remove('bg-primary-container', 'text-black', 'shadow-[2px_-2px_0px_#000000]');
        btn.classList.add('bg-surface-container', 'text-on-surface-variant');
    });

    const activeBtn = document.getElementById('tab-btn-' + category);
    if (activeBtn) {
        activeBtn.classList.remove('bg-surface-container', 'text-on-surface-variant');
        activeBtn.classList.add('bg-primary-container', 'text-black', 'shadow-[2px_-2px_0px_#000000]');
    }

    document.querySelectorAll('.gallery-card').forEach(card => {
        if (category === 'all' || card.getAttribute('data-cat') === category) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}

// 7. Form Kontak Simulasi (Halaman 7)
function handleContactSubmit(e) {
    e.preventDefault();
    showToast('Pesan layanan & verifikasi Anda telah berhasil dikirim ke sekretariat Zakara.');
    e.target.reset();
}

// 8. Salin Teks Aman
function copyTextSafe(text) {
    const temp = document.createElement('input');
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);
    showToast('Nomor simulasi fiktif (' + text + ') berhasil disalin!');
}

// 9. Notifikasi Toast Neo-Brutalist
function showToast(message) {
    const toast = document.getElementById('toast-notification');
    const textEl = document.getElementById('toast-text');
    if (!toast || !textEl) return;
    toast.classList.remove('z-50');
    toast.classList.add('z-[100000]');
    textEl.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4500);
}

// Jalankan sinkronisasi otomatis saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    applyResponsiveFixesAndFaviconLogo();
    unlockFlexibleNumericInputs();
    initZakatCalculator();
    injectDistributionControls();
    syncAllPagesWithDB();
    const urlParams = new URLSearchParams(window.location.search);
    const cat = urlParams.get('cat');
    if (cat && document.getElementById('gallery-grid')) {
        filterGallery(cat);
    }
});