.checkout-summary{padding:12px 20px;background:var(--surface2);border-bottom:1px solid var(--border);max-height:160px;overflow-y:auto}
.checkout-item{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)}
.checkout-item:last-of-type{border-bottom:none}
.checkout-item-img{width:36px;height:36px;border-radius:6px;background:var(--surface);display:flex;align-items:center;justify-content:center;font-size:16px;overflow:hidden;flex-shrink:0}
.checkout-item-img img{width:100%;height:100%;object-fit:cover}
.checkout-item-name{flex:1;font-size:13px;color:var(--text2)}
.checkout-item-price{font-size:13px;font-weight:600;color:var(--accent)}
.checkout-total{display:flex;justify-content:space-between;padding-top:8px;margin-top:6px;border-top:1px solid var(--border2)}
.checkout-total span{font-size:13px;color:var(--text2)}
.checkout-total strong{font-size:16px;color:var(--accent)}
.checkout-fields{padding:16px 20px;display:flex;flex-direction:column;gap:10px;overflow-y:auto;flex:1}
.checkout-section-title{font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px}
.checkout-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.checkout-field{display:flex;flex-direction:column;gap:4px}
.checkout-field label{font-size:11px;color:var(--text2);font-weight:500}
.checkout-input{background:var(--surface2);border:1px solid var(--border2);color:var(--text);padding:9px 12px;border-radius:var(--radius);font-size:13px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .15s;width:100%}
.checkout-input:focus{border-color:var(--accent)}
.checkout-select{cursor:pointer}
.cart-pay-error{margin:8px 20px 0;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:var(--red);padding:8px 12px;border-radius:var(--radius);font-size:12px}
.cart-pay-final{margin:12px 20px;width:calc(100% - 40px);display:flex;align-items:center;justify-content:center;gap:8px}
.cart-secure-note{text-align:center;font-size:11px;color:var(--text3);padding-bottom:14px}

/* CONTACT FORM — état fonctionnel */
.prev-form-error{color:#ef4444;font-size:12px;margin-bottom:8px;width:100%;max-width:500px}
.prev-form-success{background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;font-size:14px;font-weight:600;padding:10px 16px;border-radius:8px;width:100%;max-width:500px;margin-bottom:8px;text-align:center}
.prev-form-btn:disabled{opacity:.6;cursor:not-allowed}

/* ================================================================
   RESPONSIVE BUILDER — Mobile vs Desktop
   Mobile (<768px) : interface simplifiée, sidebar cachée
   Desktop (>768px) : layout complet avec sidebar
================================================================ */

/* ── Desktop : tout normal ─────────────────────────────────── */
@media (min-width: 769px) {
  .topbar { flex-wrap:nowrap }
  .page-tabs { display:flex }
  .workspace { flex-direction:row }
  .sidebar { display:flex }
}

/* ── Mobile (<768px) ────────────────────────────────────────── */
@media (max-width: 768px) {

  /* TOPBAR mobile : logo + save + toggle */
  :root { --sidebar-w: 0px; --topbar-h: 52px }

  /* PRODUITS : 1 colonne sur petit mobile */
  .prev-products { padding: 20px 12px }
  .prev-products-grid { grid-template-columns: 1fr; gap: 14px }
  .prev-product-img { height: 220px }
  .prev-product-img-ph { height: 220px; font-size: 56px }

  .topbar {
    padding: 0 10px;
    gap: 6px;
    overflow-x: auto;
    flex-wrap: nowrap;
  }

  /* Masquer les éléments secondaires de la topbar */
  .page-tabs          { display:none }
  .brand-badge        { display:none }
  .save-status        { display:none }
  .lang-select        { display:none }
  .pub-btn-group      { flex-shrink:0 }

  /* Brand compact */
  .topbar-brand { gap:6px; min-width:0; flex-shrink:1 }
  .brand-name-input { max-width:80px; font-size:12px }
  .site-logo-img { height:28px }

  /* Boutons topbar : plus petits */
  .btn-action {
    padding: 5px 8px;
    font-size: 12px;
  }
  .btn-action.icon-btn { padding:5px 8px; font-size:14px }

  /* WORKSPACE : sidebar cachée par défaut */
  .workspace { flex-direction: column }
  .sidebar {
    display: none;
    position: fixed;
    top: var(--topbar-h);
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 150;
    width: 100%;
    height: calc(100vh - var(--topbar-h));
    overflow-y: auto;
  }
  .sidebar.sidebar-open { display: flex }

  /* CANVAS mobile : pleine largeur */
  .canvas {
    padding: 12px;
    min-height: calc(100vh - var(--topbar-h));
  }
  .canvas-frame {
    width: 100% !important;
    min-width: unset !important;
  }

  /* Bouton toggle sidebar mobile */
  .sidebar-toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    flex-shrink: 0;
  }

  /* CART modal : plein écran sur mobile */
  .cart-overlay .cart-modal {
    max-width: 100%;
    max-height: 95vh;
    border-radius: 16px 16px 0 0;
    margin-top: auto;
  }
  .cart-overlay {
    align-items: flex-end !important;
  }

  /* Config modal : plein écran sur mobile */
  .config-modal { max-width:100%; border-radius:16px 16px 0 0; margin:auto 0 0 }

  /* SECTION edit : padding réduit */
  .sec-hero, .sec-text, .sec-image, .sec-features, .sec-payment { padding:16px }
}

/* Bouton sidebar toggle — caché sur desktop */
.sidebar-toggle-btn { display:none }

/* TABLET (480–768px) : 2 colonnes produits */
@media (min-width: 480px) and (max-width: 768px) {
  .prev-products { padding: 24px 16px }
  .prev-products-grid { grid-template-columns: repeat(2,1fr); gap: 14px }
  .prev-product-img { height: 180px }
  .prev-product-img-ph { height: 180px }
}

/* ── Aperçu public : responsive nav ────────────────────────── */
@media(max-width:640px) {
  .pv-nav { padding:0 10px; height:54px }
  .pv-brand { margin-right:8px }
  .pv-site-name { font-size:14px }
  .pv-menu { gap:0 }
  .pv-menu-item { padding:6px 8px; font-size:12px }
  .pv-cart-label { display:none }
  .pv-lang-select { padding:6px 8px; font-size:11px; max-width:90px }
  .pv-cart-btn { padding:7px 12px }
}

/* ── Config Paiement Modal ──────────────────────────────── */
.pay-config-modal{max-width:560px;max-height:88vh;overflow-y:auto}
.pay-form-fields{padding:0 4px;display:flex;flex-direction:column;gap:12px;max-height:440px;overflow-y:auto;padding-right:8px}
.pcf-section-title{font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;padding-bottom:6px;border-bottom:1px solid var(--border)}
.pcf-field{display:flex;flex-direction:column;gap:4px}
.pcf-field label{font-size:12px;font-weight:600;color:var(--text2)}
.pcf-required{color:#ef4444}
.pcf-input{background:var(--surface2);border:1px solid var(--border2);color:var(--text);padding:9px 12px;border-radius:var(--radius);font-size:13px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .15s;width:100%}
.pcf-input:focus{border-color:var(--accent)}
.pcf-select{cursor:pointer}
.pcf-url{font-family:monospace;font-size:11px}
.pcf-hint{font-size:11px;color:var(--text3);line-height:1.4}
.pcf-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pcf-info-box{background:rgba(108,99,255,.08);border:1px solid rgba(108,99,255,.2);border-radius:8px;padding:10px 14px;font-size:12px;color:var(--text2);line-height:1.6}
.pcf-link{color:var(--accent);text-decoration:none;font-weight:600}
.pcf-link:hover{text-decoration:underline}
.pcf-checkbox-group{display:flex;flex-wrap:wrap;gap:8px;padding:8px 0}
.pcf-checkbox{display:flex;align-items:center;gap:5px;font-size:12px;color:var(--text2);cursor:pointer;background:var(--surface2);border:1px solid var(--border2);padding:4px 10px;border-radius:6px;transition:all .15s}
.pcf-checkbox:hover{border-color:var(--accent)}
.pcf-checkbox input{accent-color:var(--accent)}

/* ── Topbar User Info ───────────────────────────────────── */
.topbar-user{display:flex;align-items:center;gap:8px;padding:4px 10px;background:var(--surface2);border:1px solid var(--border2);border-radius:10px;flex-shrink:0}
.topbar-user-avatar{width:30px;height:30px;border-radius:50%;overflow:hidden;flex-shrink:0;background:linear-gradient(135deg,#6c63ff,#a78bfa);display:flex;align-items:center;justify-content:center}
.topbar-avatar-img{width:100%;height:100%;object-fit:cover}
.topbar-avatar-initials{color:white;font-size:13px;font-weight:700}
.topbar-user-info{display:flex;flex-direction:column;min-width:0}
.topbar-user-name{font-size:12px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px}
.topbar-user-email{font-size:10px;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px}
.topbar-signout-btn{background:none;border:none;color:var(--text3);cursor:pointer;font-size:16px;padding:4px;border-radius:6px;transition:all .15s;flex-shrink:0}
.topbar-signout-btn:hover{background:rgba(239,68,68,.15);color:#ef4444}

/* Mobile : masquer les détails user, garder juste l'avatar + logout */
@media(max-width:768px){
  .topbar-user-info{display:none}
  .topbar-user{padding:4px 6px;gap:4px}
  .topbar-user-name,.topbar-user-email{display:none}
}

/* ── Product image area + camera ────────────────────────── */
.product-img-area{display:flex;flex-direction:column;gap:4px}
.product-img-actions{display:flex;gap:4px;justify-content:center;padding:4px 0}
.product-img-btn{display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:7px;border:none;cursor:pointer;font-size:14px;transition:all .15s}
.upload-btn{background:#ede9fe;color:#6c63ff}
.upload-btn:hover{background:#ddd6fe}
.camera-btn{background:#ecfdf5;color:#059669}
.camera-btn:hover{background:#d1fae5}
.remove-btn{background:#fef2f2;color:#ef4444}
.remove-btn:hover{background:#fee2e2}

/* ── Profil utilisateur popup ───────────────────────────── */
.user-profile-overlay .modal-box{max-width:420px}
.user-profile-modal{padding:28px}
.up-avatar-section{display:flex;align-items:center;gap:16px;margin-bottom:24px}
.up-avatar-big{width:64px;height:64px;border-radius:50%;overflow:hidden;flex-shrink:0;background:linear-gradient(135deg,#6c63ff,#a78bfa);display:flex;align-items:center;justify-content:center}
.up-avatar-img{width:100%;height:100%;object-fit:cover}
.up-avatar-initials{color:white;font-size:26px;font-weight:700}
.up-user-details{flex:1;min-width:0}
.up-user-name{font-size:17px;font-weight:700;color:var(--text);margin-bottom:3px}
.up-user-email{font-size:13px;color:var(--text3);word-break:break-all}
.up-user-badge{margin-top:6px}
.up-badge-pro{background:linear-gradient(135deg,#6c63ff,#a78bfa);color:white;font-size:10px;font-weight:700;padding:3px 10px;border-radius:100px;display:inline-block}
.up-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px}
.up-info-item{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px 12px}
.up-info-label{display:block;font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
.up-info-value{font-size:12px;font-weight:600;color:var(--text)}
.up-info-value code{font-family:monospace;font-size:11px;color:var(--accent)}
.up-verified{color:#10b981}
.up-unverified{color:#ef4444}
.up-actions{display:flex;flex-direction:column;gap:8px}
.up-btn-orders{width:100%;padding:11px;background:var(--surface2);border:1px solid var(--border2);color:var(--text);border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s;text-align:center}
.up-btn-orders:hover{border-color:var(--accent);color:var(--accent)}
.up-btn-signout{width:100%;padding:11px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);color:#ef4444;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s}
.up-btn-signout:hover{background:rgba(239,68,68,.2)}

/* Curseur pointer sur l'avatar topbar */
.topbar-user{cursor:pointer;user-select:none}
.topbar-user:hover .topbar-user-avatar{box-shadow:0 0 0 2px var(--accent)}

/* ── Écran déconnexion ───────────────────────────────────── */
.signout-overlay{position:fixed;inset:0;z-index:9999;background:linear-gradient(135deg,#0f0f11,#1a1a2e);display:flex;align-items:center;justify-content:center;font-family:'DM Sans',sans-serif}
.signout-card{text-align:center;display:flex;flex-direction:column;align-items:center;gap:16px;padding:48px 36px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:24px;max-width:360px;width:90%}
.signout-icon{font-size:56px;animation:wave 1.2s ease-in-out}
@keyframes wave{0%,100%{transform:rotate(0deg)}25%{transform:rotate(20deg)}75%{transform:rotate(-10deg)}}
.signout-title{font-family:'Playfair Display',serif;font-size:28px;color:white}
.signout-sub{font-size:15px;color:rgba(255,255,255,.5)}
.signout-reload{background:linear-gradient(135deg,#6c63ff,#a78bfa);color:white;border:none;border-radius:12px;padding:14px 32px;font-size:15px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;margin-top:8px}
.signout-reload:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(108,99,255,.4)}

/* ── Aperçu : bouton connexion/déconnexion ──────────────── */
.pv-user-btn{display:flex;align-items:center;gap:7px;padding:6px 12px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:10px;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif}
.pv-user-btn:hover{background:#ede9fe;border-color:#6c63ff}
.pv-user-avatar{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#6c63ff,#a78bfa);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;overflow:hidden;flex-shrink:0}
.pv-user-avatar-img{width:100%;height:100%;object-fit:cover}
.pv-user-name{font-size:12px;font-weight:600;color:#374151;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pv-login-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;background:#6c63ff;color:white;border:none;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s;white-space:nowrap}
.pv-login-btn:hover{background:#5b52ee;transform:translateY(-1px)}

/* ── Écran déconnexion + formulaire auth complet ────────── */
.signout-card{max-height:90vh;overflow-y:auto;scrollbar-width:none}
.signout-card::-webkit-scrollbar{display:none}
/* Onglets */
.so-tabs{display:flex;background:rgba(255,255,255,.06);border-radius:10px;padding:3px;gap:3px;width:100%}
.so-tab{flex:1;padding:8px;background:none;border:none;border-radius:8px;font-size:13px;font-weight:500;color:rgba(255,255,255,.45);cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s}
.so-tab.active{background:rgba(108,99,255,.4);color:white;font-weight:700}
/* Messages */
.so-error{background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:#fca5a5;padding:9px 12px;border-radius:8px;font-size:13px;text-align:center;width:100%}
.so-success{background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.3);color:#6ee7b7;padding:9px 12px;border-radius:8px;font-size:13px;text-align:center;width:100%}
/* Form */
.so-form{display:flex;flex-direction:column;gap:10px;width:100%}
.so-field{display:flex;flex-direction:column;gap:4px;text-align:left}
.so-field label{font-size:12px;font-weight:600;color:rgba(255,255,255,.5);display:flex;align-items:center;gap:4px}
.so-hint{font-size:10px;color:rgba(255,255,255,.3);font-weight:400}
.so-input{padding:11px 14px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:10px;color:white;font-size:14px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .15s;width:100%}
.so-input:focus{border-color:#6c63ff;background:rgba(108,99,255,.08)}
.so-input::placeholder{color:rgba(255,255,255,.25)}
/* Bouton principal */
.so-submit{width:100%;padding:13px;background:linear-gradient(135deg,#6c63ff,#a78bfa);color:white;border:none;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px}
.so-submit:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(108,99,255,.4)}
.so-submit:disabled{opacity:.6;cursor:not-allowed}
/* Spinner */
.so-spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:so-spin .6s linear infinite}
@keyframes so-spin{to{transform:rotate(360deg)}}
/* Séparateur */
.so-separator{display:flex;align-items:center;gap:10px;color:rgba(255,255,255,.3);font-size:11px;width:100%}
.so-separator::before,.so-separator::after{content:'';flex:1;border-top:1px solid rgba(255,255,255,.1)}
/* Google */
.so-google{width:100%;padding:11px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.8);border-radius:10px;font-size:13px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .15s}
.so-google:hover:not(:disabled){background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.2)}
.so-google:disabled{opacity:.5;cursor:not-allowed}
/* Mot de passe oublié */
.so-forgot-btn{background:none;border:none;color:rgba(108,99,255,.8);font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;text-align:right;padding:2px 0;transition:color .15s;align-self:flex-end}
.so-forgot-btn:hover{color:#a78bfa}
.so-forgot-desc{font-size:13px;color:rgba(255,255,255,.5);line-height:1.6;text-align:center}
.so-back-link{background:none;border:none;color:rgba(255,255,255,.4);font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;text-align:center;padding:4px;transition:color .15s}
.so-back-link:hover{color:rgba(255,255,255,.7)}

/* Responsive aperçu mobile */
@media(max-width:640px){
  .pv-user-name{display:none}
  .pv-login-btn span:last-child{display:none}
}

.topbar-login-btn{background:linear-gradient(135deg,#6c63ff,#a78bfa);color:white;border:none;border-radius:9px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;white-space:nowrap}
.topbar-login-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(108,99,255,.4)}

.up-badge-customer{background:linear-gradient(135deg,#10b981,#059669);color:white;font-size:10px;font-weight:700;padding:3px 10px;border-radius:100px;display:inline-block}
.up-orders-section{background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:4px}
.up-orders-title{font-size:13px;font-weight:700;color:var(--text);margin-bottom:10px;display:flex;align-items:center;gap:8px}
.up-orders-count{background:var(--accent);color:white;font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px;margin-left:auto}
.up-orders-loading{color:var(--text3);font-size:11px;margin-left:auto}
.up-orders-empty{font-size:13px;color:var(--text3);text-align:center;padding:10px 0}
.up-orders-list{display:flex;flex-direction:column;gap:6px}
.up-order-item{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--surface);border:1px solid var(--border);border-radius:8px}
.up-order-left{display:flex;flex-direction:column;gap:2px}
.up-order-id{font-size:12px;font-weight:700;color:var(--text);font-family:monospace}
.up-order-date{font-size:10px;color:var(--text3)}
.up-order-right{display:flex;flex-direction:column;align-items:flex-end;gap:3px}
.up-order-total{font-size:13px;font-weight:700;color:var(--accent)}
.up-order-status{font-size:10px;font-weight:600;padding:2px 8px;border-radius:100px}
.status-paid{background:rgba(16,185,129,.15);color:#10b981}
.status-pending{background:rgba(245,158,11,.15);color:#f59e0b}
.status-shipped{background:rgba(108,99,255,.15);color:#6c63ff}
.status-delivered{background:rgba(16,185,129,.2);color:#059669}
.status-cancelled{background:rgba(239,68,68,.15);color:#ef4444}

</style>
