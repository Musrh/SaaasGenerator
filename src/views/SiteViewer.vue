<!-- ============================================================
  SaaasGenerator/src/views/SiteViewer.vue
  
  Affiche le site PUBLIÉ d'un propriétaire de store.
  Route  : /site/:uid
  
  🔧 FIX : Footer toujours visible grâce à min-h-screen + flex
============================================================ -->

<template>
  <!-- ✅ WRAPPER FLEX pour footer collé en bas -->
  <div class="flex flex-col min-h-screen bg-white text-gray-800">

    <!-- ══════════════════════════════════════════════════════════
         LOADING
    ══════════════════════════════════════════════════════════ -->
    <div v-if="loading" class="flex-grow flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        <p class="text-gray-500">Chargement du site…</p>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════
         ERREUR 404
    ══════════════════════════════════════════════════════════ -->
    <div v-else-if="error" class="flex-grow flex items-center justify-center">
      <div class="text-center max-w-md mx-auto p-8">
        <div class="text-6xl mb-4">😕</div>
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Site introuvable</h1>
        <p class="text-gray-500 mb-4">{{ error }}</p>
        <p v-if="debugInfo" class="text-xs text-gray-400 bg-gray-50 rounded p-3 mb-4">{{ debugInfo }}</p>
        <button @click="router.push('/')" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Retour à l'accueil
        </button>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════
         SITE CONTENT
    ══════════════════════════════════════════════════════════ -->
    <template v-else-if="site">

      <!-- ── NAVBAR ──────────────────────────────────────────── -->
      <nav class="sticky top-0 z-50 bg-white/95 backdrop-blur shadow-sm border-b border-gray-100">
        <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <!-- Logo + Nom -->
          <div class="flex items-center gap-3">
            <img v-if="siteMeta.logo" :src="siteMeta.logo" alt="Logo" class="h-8 w-8 rounded-full object-cover" />
            <span class="font-bold text-lg text-gray-800">{{ siteMeta.name || 'Mon Store' }}</span>
          </div>

          <!-- Navigation pages -->
          <div class="hidden md:flex items-center gap-4">
            <button v-for="(page, i) in site.pages" :key="i"
              @click="currentPageIndex = i"
              :class="[
                'px-3 py-1.5 rounded-lg text-sm font-medium transition',
                currentPageIndex === i
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              ]">
              {{ page.name || 'Page ' + (i+1) }}
            </button>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3">
            <!-- Panier -->
            <button @click="showCart = true" class="relative p-2 rounded-full hover:bg-gray-100 transition">
              🛒
              <span v-if="cartCount" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {{ cartCount }}
              </span>
            </button>

            <!-- Auth / Profil -->
            <template v-if="svCurrentUser">
              <button @click="svOpenProfile" class="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full hover:bg-gray-200 transition text-sm">
                <span class="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {{ (svCurrentUser.displayName || svCurrentUser.email || '?')[0].toUpperCase() }}
                </span>
                <span class="hidden sm:inline text-gray-700">{{ svCurrentUser.displayName || 'Mon compte' }}</span>
              </button>
            </template>
            <template v-else>
              <button @click="svShowAuth = true; svAuthMode = 'login'"
                class="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">
                Connexion
              </button>
            </template>
          </div>
        </div>

        <!-- Nav mobile -->
        <div class="md:hidden flex gap-2 px-4 pb-2 overflow-x-auto">
          <button v-for="(page, i) in site.pages" :key="'m'+i"
            @click="currentPageIndex = i"
            :class="[
              'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition',
              currentPageIndex === i ? 'bg-blue-100 text-blue-700' : 'text-gray-500 bg-gray-50'
            ]">
            {{ page.name || 'Page ' + (i+1) }}
          </button>
        </div>
      </nav>

      <!-- ── MAIN CONTENT (flex-grow pour pousser le footer) ── -->
      <main class="flex-grow">
        <div v-if="currentPage" class="max-w-7xl mx-auto px-4 py-8">

          <!-- HERO -->
          <section v-if="currentPage.hero" class="mb-12 text-center py-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
            <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {{ currentPage.hero.title || siteMeta.name || 'Bienvenue' }}
            </h1>
            <p v-if="currentPage.hero.subtitle" class="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              {{ currentPage.hero.subtitle }}
            </p>
            <img v-if="currentPage.hero.image" :src="currentPage.hero.image" alt="Hero"
              class="max-h-80 mx-auto rounded-xl shadow-lg mt-6" />
          </section>

          <!-- BLOCS DYNAMIQUES -->
          <template v-for="(block, bi) in currentPage.blocks" :key="bi">

            <!-- Texte -->
            <section v-if="block.type === 'text'" class="mb-10 max-w-3xl mx-auto">
              <h2 v-if="block.title" class="text-2xl font-bold mb-3">{{ block.title }}</h2>
              <div class="prose prose-lg text-gray-600" v-html="block.content || block.text"></div>
            </section>

            <!-- Image -->
            <section v-if="block.type === 'image'" class="mb-10 text-center">
              <img :src="block.url || block.src" :alt="block.alt || 'Image'" class="max-w-full mx-auto rounded-xl shadow" />
              <p v-if="block.caption" class="text-sm text-gray-500 mt-2">{{ block.caption }}</p>
            </section>

            <!-- Vidéo -->
            <section v-if="block.type === 'video'" class="mb-10">
              <div class="max-w-3xl mx-auto aspect-video rounded-xl overflow-hidden shadow">
                <iframe :src="getEmbedUrl(block.url)" class="w-full h-full" frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen></iframe>
              </div>
            </section>

            <!-- Produits -->
            <section v-if="block.type === 'products'" class="mb-12">
              <h2 v-if="block.title" class="text-2xl font-bold mb-6 text-center">{{ block.title }}</h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <div v-for="(product, pi) in block.items" :key="pi"
                  class="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden border border-gray-100">
                  <img v-if="product.image" :src="product.image" :alt="product.name"
                    class="w-full h-48 object-cover" />
                  <div class="p-4">
                    <h3 class="font-bold text-gray-800">{{ product.name }}</h3>
                    <p v-if="product.description" class="text-sm text-gray-500 mt-1 line-clamp-2">{{ product.description }}</p>
                    <div class="flex items-center justify-between mt-3">
                      <span class="text-lg font-bold text-blue-600">{{ product.price }} {{ product.currency || '€' }}</span>
                      <button @click="addToCart(product)"
                        class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">
                        Ajouter 🛒
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Contact -->
            <section v-if="block.type === 'contact'" class="mb-12 max-w-lg mx-auto">
              <h2 class="text-2xl font-bold mb-6 text-center">{{ block.title || 'Contact' }}</h2>
              <form @submit.prevent="sendContact" class="space-y-4">
                <input v-model="contactName" placeholder="Votre nom" class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none" />
                <input v-model="contactEmail" type="email" placeholder="Votre email" class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none" />
                <textarea v-model="contactMessage" placeholder="Votre message" rows="4" class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none resize-none"></textarea>
                <p v-if="contactError" class="text-red-500 text-sm">{{ contactError }}</p>
                <p v-if="contactSent" class="text-green-600 text-sm">✅ Message envoyé avec succès !</p>
                <button type="submit" :disabled="contactSending"
                  class="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium">
                  {{ contactSending ? 'Envoi…' : 'Envoyer' }}
                </button>
              </form>
            </section>

          </template>
        </div>
      </main>

      <!-- ══════════════════════════════════════════════════════
           ✅ FOOTER — TOUJOURS VISIBLE
      ══════════════════════════════════════════════════════ -->
      <footer class="bg-gray-900 text-gray-300 mt-auto">
        <div class="max-w-7xl mx-auto px-6 py-12">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">

            <!-- Colonne 1 : À propos -->
            <div>
              <div class="flex items-center gap-3 mb-4">
                <img v-if="siteMeta.logo" :src="siteMeta.logo" alt="Logo" class="h-8 w-8 rounded-full object-cover" />
                <span class="text-white font-bold text-lg">{{ siteMeta.name || 'Mon Store' }}</span>
              </div>
              <p class="text-sm text-gray-400 leading-relaxed">
                Votre boutique en ligne de confiance. Qualité, rapidité et satisfaction garantie.
              </p>
            </div>

            <!-- Colonne 2 : Navigation -->
            <div>
              <h4 class="text-white font-semibold mb-4">Navigation</h4>
              <ul class="space-y-2">
                <li v-for="(page, i) in site.pages" :key="'f'+i">
                  <button @click="currentPageIndex = i; window.scrollTo({top:0, behavior:'smooth'})"
                    class="text-sm text-gray-400 hover:text-white transition">
                    {{ page.name || 'Page ' + (i+1) }}
                  </button>
                </li>
              </ul>
            </div>

            <!-- Colonne 3 : Contact -->
            <div>
              <h4 class="text-white font-semibold mb-4">Contact</h4>
              <p class="text-sm text-gray-400">📧 contact@{{ (siteMeta.name || 'store').toLowerCase().replace(/\s/g, '') }}.com</p>
              <div class="flex gap-3 mt-4">
                <a href="#" class="w-8 h-8 bg-gray-700 hover:bg-blue-600 rounded-full flex items-center justify-center transition text-sm">f</a>
                <a href="#" class="w-8 h-8 bg-gray-700 hover:bg-sky-500 rounded-full flex items-center justify-center transition text-sm">𝕏</a>
                <a href="#" class="w-8 h-8 bg-gray-700 hover:bg-pink-600 rounded-full flex items-center justify-center transition text-sm">ig</a>
              </div>
            </div>
          </div>

          <!-- Barre bas -->
          <div class="border-t border-gray-700 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p class="text-xs text-gray-500">
              © {{ new Date().getFullYear() }} {{ siteMeta.name || 'Mon Store' }} — Tous droits réservés
            </p>
            <p class="text-xs text-gray-600">
              Propulsé par <span class="text-blue-400 font-medium">SaaasGenerator</span>
            </p>
          </div>
        </div>
      </footer>

    </template>

    <!-- ══════════════════════════════════════════════════════════
         MODAL AUTH CLIENT
    ══════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="svShowAuth" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" @click.self="svShowAuth = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 relative">
          <button @click="svShowAuth = false" class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl">✕</button>

          <h2 class="text-xl font-bold text-center mb-6">
            {{ svAuthMode === 'login' ? 'Connexion' : svAuthMode === 'register' ? 'Créer un compte' : 'Mot de passe oublié' }}
          </h2>

          <!-- Login -->
          <form v-if="svAuthMode === 'login'" @submit.prevent="svLogin" class="space-y-4">
            <input v-model="svEmail" type="email" placeholder="Email" class="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-300" />
            <input v-model="svPassword" type="password" placeholder="Mot de passe" class="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-300" />
            <p v-if="svAuthError" class="text-red-500 text-sm">{{ svAuthError }}</p>
            <p v-if="svAuthSuccess" class="text-green-600 text-sm">{{ svAuthSuccess }}</p>
            <button type="submit" :disabled="svAuthLoading" class="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium">
              {{ svAuthLoading ? 'Connexion…' : 'Se connecter' }}
            </button>
            <div class="text-center text-sm space-y-1">
              <button type="button" @click="svAuthMode = 'forgot'" class="text-blue-600 hover:underline">Mot de passe oublié ?</button>
              <p class="text-gray-500">Pas de compte ? <button type="button" @click="svAuthMode = 'register'" class="text-blue-600 hover:underline">Créer un compte</button></p>
            </div>
          </form>

          <!-- Register -->
          <form v-if="svAuthMode === 'register'" @submit.prevent="svRegister" class="space-y-4">
            <input v-model="svName" placeholder="Nom complet" class="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-300" />
            <input v-model="svEmail" type="email" placeholder="Email" class="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-300" />
            <input v-model="svPassword" type="password" placeholder="Mot de passe (min. 6 car.)" class="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-300" />
            <input v-model="svConfirm" type="password" placeholder="Confirmer le mot de passe" class="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-300" />
            <p v-if="svAuthError" class="text-red-500 text-sm">{{ svAuthError }}</p>
            <p v-if="svAuthSuccess" class="text-green-600 text-sm">{{ svAuthSuccess }}</p>
            <button type="submit" :disabled="svAuthLoading" class="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium">
              {{ svAuthLoading ? 'Création…' : 'Créer mon compte' }}
            </button>
            <p class="text-center text-sm text-gray-500">Déjà un compte ? <button type="button" @click="svAuthMode = 'login'" class="text-blue-600 hover:underline">Se connecter</button></p>
          </form>

          <!-- Forgot -->
          <form v-if="svAuthMode === 'forgot'" @submit.prevent="svForgot" class="space-y-4">
            <input v-model="svEmail" type="email" placeholder="Votre email" class="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-300" />
            <p v-if="svAuthError" class="text-red-500 text-sm">{{ svAuthError }}</p>
            <p v-if="svAuthSuccess" class="text-green-600 text-sm">{{ svAuthSuccess }}</p>
            <button type="submit" :disabled="svAuthLoading" class="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium">
              {{ svAuthLoading ? 'Envoi…' : 'Réinitialiser' }}
            </button>
            <p class="text-center text-sm text-gray-500"><button type="button" @click="svAuthMode = 'login'" class="text-blue-600 hover:underline">← Retour à la connexion</button></p>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════
         MODAL PANIER
    ══════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showCart" class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" @click.self="showCart = false">
        <div class="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg mx-0 sm:mx-4 p-6 max-h-[80vh] overflow-y-auto relative">
          <button @click="showCart = false" class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl">✕</button>
          <h2 class="text-xl font-bold mb-4">🛒 Mon panier</h2>

          <div v-if="!cart.length" class="text-center py-8 text-gray-400">
            <p class="text-4xl mb-2">🛒</p>
            <p>Votre panier est vide</p>
          </div>

          <div v-else>
            <!-- Étape panier -->
            <template v-if="svCartStep === 'cart'">
              <div v-for="item in cart" :key="item.id" class="flex items-center gap-4 py-3 border-b last:border-0">
                <img v-if="item.image" :src="item.image" class="w-14 h-14 rounded-lg object-cover" />
                <div class="flex-grow">
                  <p class="font-medium text-sm">{{ item.name }}</p>
                  <p class="text-sm text-gray-500">{{ item.price }} {{ item.currency || '€' }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <button @click="updateQty(item.id, -1)" class="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-sm">−</button>
                  <span class="text-sm font-medium w-6 text-center">{{ item.qty }}</span>
                  <button @click="updateQty(item.id, 1)" class="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-sm">+</button>
                </div>
                <button @click="removeFromCart(item.id)" class="text-red-400 hover:text-red-600 text-lg">✕</button>
              </div>

              <div class="mt-4 pt-4 border-t flex items-center justify-between">
                <span class="font-bold text-lg">Total : {{ cartTotal }} {{ cartCurrency }}</span>
                <button @click="svCartStep = 'checkout'"
                  class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                  Commander →
                </button>
              </div>
            </template>

            <!-- Étape checkout -->
            <template v-if="svCartStep === 'checkout'">
              <button @click="svCartStep = 'cart'" class="text-sm text-blue-600 hover:underline mb-4">← Retour au panier</button>

              <div class="space-y-3 mb-4">
                <input v-model="customerName" placeholder="Nom complet *" class="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-300" />
                <input v-model="customerEmail" type="email" placeholder="Email *" class="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-300" />
                <input v-model="svAddress" placeholder="Adresse de livraison" class="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-300" />
                <div class="grid grid-cols-2 gap-3">
                  <input v-model="svZip" placeholder="Code postal" class="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-300" />
                  <input v-model="svCity" placeholder="Ville" class="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <input v-model="svCountry" placeholder="Pays" class="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-300" />
              </div>

              <!-- Choix paiement -->
              <div class="space-y-3">
                <h3 class="font-semibold text-sm text-gray-700">Mode de paiement</h3>

                <button v-if="storePayConfig.stripe"
                  @click="payWithStripe" :disabled="payProcessing"
                  class="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition font-medium flex items-center justify-center gap-2">
                  💳 {{ payProcessing ? 'Redirection…' : 'Payer par carte (Stripe)' }}
                </button>

                <div v-if="storePayConfig.paypal">
                  <button @click="payProvider = 'paypal'; showPayModal = true"
                    class="w-full py-3 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 transition font-medium">
                    🅿️ Payer avec PayPal
                  </button>
                </div>

                <p v-if="!storePayConfig.stripe && !storePayConfig.paypal" class="text-sm text-gray-400 text-center py-4">
                  Aucun moyen de paiement configuré pour ce store.
                </p>

                <p v-if="payError" class="text-red-500 text-sm mt-2">{{ payError }}</p>
              </div>

              <div class="mt-4 pt-3 border-t text-right">
                <span class="font-bold text-lg">Total : {{ cartTotal }} {{ cartCurrency }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════
         MODAL PAYPAL
    ══════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showPayModal && payProvider === 'paypal'" class="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm" @click.self="showPayModal = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
          <h3 class="text-lg font-bold mb-4">Paiement PayPal</h3>
          <div id="sv-paypal-container" class="min-h-[120px]"></div>
          <p v-if="payError" class="text-red-500 text-sm mt-3">{{ payError }}</p>
          <button @click="showPayModal = false" class="mt-4 w-full py-2 border rounded-lg text-gray-600 hover:bg-gray-50 transition">Annuler</button>
        </div>
      </div>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════
         MODAL PROFIL CLIENT
    ══════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="svShowProfile" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" @click.self="svShowProfile = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[80vh] overflow-y-auto relative">
          <button @click="svShowProfile = false" class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl">✕</button>

          <div class="text-center mb-6">
            <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3">
              {{ (svCurrentUser?.displayName || svCurrentUser?.email || '?')[0].toUpperCase() }}
            </div>
            <h2 class="text-xl font-bold">{{ svCurrentUser?.displayName || 'Client' }}</h2>
            <p class="text-sm text-gray-500">{{ svCurrentUser?.email }}</p>
          </div>

          <!-- Commandes -->
          <div class="border-t pt-4">
            <h3 class="font-semibold mb-3">📦 Mes commandes</h3>

            <div v-if="svLoadingOrders" class="text-center py-4">
              <div class="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mx-auto"></div>
            </div>

            <div v-else-if="svOrdersLoaded && !svClientOrders.length" class="text-center py-4 text-gray-400 text-sm">
              Aucune commande pour le moment.
            </div>

            <div v-else class="space-y-3">
              <div v-for="order in svClientOrders" :key="order.id"
                class="border rounded-lg p-3 text-sm">
                <div class="flex justify-between items-center mb-1">
                  <span class="font-medium">{{ order.id.slice(0,8) }}…</span>
                  <span :class="[
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    order.status === 'paid' ? 'bg-green-100 text-green-700' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  ]">
                    {{ order.status || 'en cours' }}
                  </span>
                </div>
                <p class="text-gray-500 text-xs">{{ order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR') : '—' }}</p>
                <p class="font-bold mt-1">{{ order.total || order.amount || '—' }} {{ order.currency || '€' }}</p>
              </div>
            </div>
          </div>

          <!-- Déconnexion -->
          <button @click="svSignOut"
            class="mt-6 w-full py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition text-sm">
            Se déconnecter
          </button>
        </div>
      </div>
    </Teleport>

    <!-- Voice Assistant -->
    <VoiceAssistantClient v-if="resolvedUid" :storeUid="resolvedUid" />

  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue"
import { useRouter } from "vue-router"
import VoiceAssistantClient from "../components/VoiceAssistantClient.vue"
import { db } from "../firebase.js"
import { doc, getDoc, collection, addDoc } from "firebase/firestore"
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth"

const clientAuth      = getAuth()
const svCurrentUser   = ref(null)
const svShowAuth      = ref(false)
const svAuthMode      = ref("login")
const svEmail         = ref("")
const svPassword      = ref("")
const svConfirm       = ref("")
const svName          = ref("")
const svAuthError     = ref("")
const svAuthSuccess   = ref("")
const svAuthLoading   = ref(false)

const svShowProfile   = ref(false)
const svClientOrders  = ref([])
const svLoadingOrders = ref(false)
const svOrdersLoaded  = ref(false)

const props  = defineProps({ uid: { type: String, required: true } })
const router = useRouter()

const site         = ref(null)
const loading      = ref(true)
const error        = ref("")
const resolvedUid  = ref("")
const siteMeta     = ref({})
const currentPageIndex = ref(0)

const storePayConfig = ref({ stripe: null, paypal: null })

const contactName    = ref("")
const contactEmail   = ref("")
const contactMessage = ref("")
const contactSending = ref(false)
const contactSent    = ref(false)
const contactError   = ref("")

const sendContact = async () => {
  if (!contactName.value || !contactEmail.value || !contactMessage.value) {
    contactError.value = "Veuillez remplir tous les champs."
    return
  }
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.value)
  if (!emailOk) { contactError.value = "Email invalide."; return }

  contactSending.value = true
  contactError.value   = ""
  try {
    const ownerUid = resolvedUid.value
    if (!ownerUid) throw new Error("Store non trouvé")

    await addDoc(collection(db, "users", ownerUid, "contacts"), {
      name:      contactName.value.trim(),
      email:     contactEmail.value.trim().toLowerCase(),
      message:   contactMessage.value.trim(),
      storeUid:  ownerUid,
      siteSlug:  props.uid,
      status:    "nouveau",
      createdAt: new Date().toISOString(),
    })
    contactSent.value    = true
    contactName.value    = ""
    contactEmail.value   = ""
    contactMessage.value = ""
    setTimeout(() => { contactSent.value = false }, 5000)
  } catch(e) {
    contactError.value = "Erreur d'envoi. Réessayez plus tard."
    console.error("Contact error:", e)
  } finally {
    contactSending.value = false
  }
}

const svCartStep = ref("cart")
const svAddress  = ref("")
const svZip      = ref("")
const svCity     = ref("")
const svCountry  = ref("France")
const cart         = ref([])
const showCart     = ref(false)
const showPayModal = ref(false)
const payProvider  = ref("stripe")
const payProcessing = ref(false)
const paySuccess   = ref(false)
const payError     = ref("")
const customerName  = ref("")
const customerEmail = ref("")

const stripeLoading = ref(false)

const cartCount    = computed(() => cart.value.reduce((s, i) => s + i.qty, 0))
const cartTotal    = computed(() => cart.value.reduce((s, i) => s + parseFloat(i.price || 0) * i.qty, 0).toFixed(2))
const cartCurrency = computed(() => cart.value[0]?.currency || "€")
const currentPage  = computed(() => site.value?.pages?.[currentPageIndex.value] || site.value?.pages?.[0])

const addToCart = (product) => {
  if (!clientAuth.currentUser) {
    router.push(`/auth?store=${props.uid}&redirect=/site/${props.uid}`)
    return
  }
  const ex = cart.value.find(i => i.id === product.id)
  ex ? ex.qty++ : cart.value.push({ ...product, qty: 1 })
  showCart.value = true
}
const removeFromCart = (id) => { cart.value = cart.value.filter(i => i.id !== id) }
const updateQty = (id, delta) => {
  const item = cart.value.find(i => i.id === id)
  if (item) item.qty = Math.max(1, item.qty + delta)
}

const getEmbedUrl = (url) => {
  if (!url) return ""
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return url
}

const debugInfo = ref("")

const loadSite = async () => {
  loading.value  = true
  error.value    = ""
  debugInfo.value = ""
  const uid = props.uid?.trim()

  if (!uid) {
    error.value = "Aucun identifiant de site fourni."
    loading.value = false
    return
  }

  try {
    let userSnap = null
    try {
      userSnap = await getDoc(doc(db, "users", uid))
    } catch(e) { console.warn("Étape 1 échouée:", e.message) }

    if (userSnap?.exists()) {
      const data = userSnap.data()
      if (data.siteData) {
        site.value        = data.siteData
        siteMeta.value    = { name: data.siteName || "", logo: data.siteLogo || "" }
        resolvedUid.value = uid
        await loadPayConfig(uid)
        loading.value = false
        return
      } else {
        debugInfo.value = `Compte trouvé (${uid}) mais le site n'a pas encore été publié.`
      }
    }

    let slugSnap = null
    try {
      slugSnap = await getDoc(doc(db, "slugs", uid))
    } catch(e) { console.warn("Étape 2 échouée:", e.message) }

    if (slugSnap?.exists()) {
      const realUid = slugSnap.data().uid
      let realSnap  = null
      try {
        realSnap = await getDoc(doc(db, "users", realUid))
      } catch(e) { console.warn("Étape 2b échouée:", e.message) }

      if (realSnap?.exists() && realSnap.data().siteData) {
        site.value        = realSnap.data().siteData
        siteMeta.value    = { name: realSnap.data().siteName || "", logo: realSnap.data().siteLogo || "" }
        resolvedUid.value = realUid
        await loadPayConfig(realUid)
        loading.value = false
        return
      } else if (realSnap?.exists()) {
        debugInfo.value = `Slug "${uid}" trouvé → UID ${realUid}, mais le site n'a pas de données publiées.`
      }
    }

    error.value = debugInfo.value || `Site "${uid}" introuvable.`
    loading.value = false

  } catch (e) {
    error.value    = "Erreur de chargement : " + e.message
    loading.value  = false
    console.error("SiteViewer loadSite error:", e)
  }
}

const loadPayConfig = async (uid) => {
  try {
    const snap = await getDoc(doc(db, "users", uid, "config", "payment"))
    if (snap.exists()) { storePayConfig.value = snap.data(); return }
    const mainSnap = await getDoc(doc(db, "users", uid))
    if (mainSnap.exists() && mainSnap.data().storePaymentConfig) {
      storePayConfig.value = mainSnap.data().storePaymentConfig
    }
  } catch (e) { console.warn("Pas de config paiement:", e.message) }
}

onMounted(() => {
  loadSite()
  onAuthStateChanged(clientAuth, (user) => { svCurrentUser.value = user })
})

// ── Auth functions ───────────────────────────────────────────
const svLogin = async () => {
  svAuthError.value = ""; svAuthSuccess.value = ""
  if (!svEmail.value || !svPassword.value) { svAuthError.value = "Email et mot de passe requis."; return }
  svAuthLoading.value = true
  try {
    const { signInWithEmailAndPassword } = await import("firebase/auth")
    await signInWithEmailAndPassword(clientAuth, svEmail.value.trim(), svPassword.value)
    svShowAuth.value = false
    svEmail.value = ""; svPassword.value = ""
  } catch(e) {
    const m = { "auth/user-not-found":"Email inconnu.","auth/wrong-password":"Mot de passe incorrect.",
      "auth/invalid-email":"Email invalide.","auth/too-many-requests":"Trop de tentatives.",
      "auth/invalid-credential":"Email ou mot de passe incorrect." }
    svAuthError.value = m[e.code] || e.message
  } finally { svAuthLoading.value = false }
}

const svRegister = async () => {
  svAuthError.value = ""; svAuthSuccess.value = ""
  if (!svName.value.trim())      { svAuthError.value = "Nom requis."; return }
  if (!svEmail.value.trim())     { svAuthError.value = "Email requis."; return }
  if (svPassword.value.length<6) { svAuthError.value = "Mot de passe : min. 6 caractères."; return }
  if (svPassword.value !== svConfirm.value) { svAuthError.value = "Mots de passe différents."; return }
  svAuthLoading.value = true
  try {
    const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth")
    const { doc: fd, setDoc: fset } = await import("firebase/firestore")
    const cred = await createUserWithEmailAndPassword(clientAuth, svEmail.value.trim(), svPassword.value)
    await updateProfile(cred.user, { displayName: svName.value.trim() })
    await fset(fd(db, "customers", cred.user.uid), {
      uid: cred.user.uid, email: svEmail.value.trim().toLowerCase(),
      displayName: svName.value.trim(), storeUid: resolvedUid.value,
      role: "customer", createdAt: new Date().toISOString(),
    }, { merge: true })
    svAuthSuccess.value = "Compte créé ! Bienvenue 🎉"
    setTimeout(() => { svShowAuth.value = false; svEmail.value=""; svPassword.value=""; svConfirm.value=""; svName.value="" }, 1400)
  } catch(e) {
    const m = { "auth/email-already-in-use":"Email déjà utilisé.","auth/weak-password":"Mot de passe trop faible." }
    svAuthError.value = m[e.code] || e.message
  } finally { svAuthLoading.value = false }
}

const svForgot = async () => {
  svAuthError.value = ""; svAuthSuccess.value = ""
  if (!svEmail.value) { svAuthError.value = "Entrez votre email."; return }
  svAuthLoading.value = true
  try {
    const { sendPasswordResetEmail } = await import("firebase/auth")
    await sendPasswordResetEmail(clientAuth, svEmail.value.trim())
    svAuthSuccess.value = "Email envoyé ! Vérifiez votre boîte mail."
  } catch(e) { svAuthError.value = e.message }
  finally { svAuthLoading.value = false }
}

const svSignOut = async () => {
  await signOut(clientAuth)
  svShowProfile.value  = false
  svClientOrders.value = []
  svOrdersLoaded.value = false
}

const svLoadOrders = async (user) => {
  if (svLoadingOrders.value) return
  svLoadingOrders.value = true
  svOrdersLoaded.value  = false
  const results = []

  const dedup = (d) => {
    if (!results.find(r => r.id === d.id)) results.push({ id: d.id, ...d.data() })
  }

  try {
    const { query: q, where, getDocs: gd, collection: col } = await import("firebase/firestore")
    const uid   = user.uid
    const email = (user.email || "").toLowerCase()

    try {
      const s1 = await gd(q(col(db, "orders"), where("clientId", "==", uid)))
      s1.docs.forEach(dedup)
    } catch(e) { console.error("[profil] orders/clientId ERREUR:", e.message) }

    if (email) {
      try {
        const s2 = await gd(q(col(db, "orders"), where("customerEmail", "==", email)))
        s2.docs.forEach(dedup)
      } catch(e) { console.error("[profil] orders/customerEmail ERREUR:", e.message) }
    }

    try {
      const s3 = await gd(q(col(db, "cmdclients"), where("clientUid", "==", uid)))
      s3.docs.forEach(dedup)
    } catch(e) { console.error("[profil] cmdclients/clientUid ERREUR:", e.message) }

    if (email) {
      try {
        const s4 = await gd(q(col(db, "cmdclients"), where("clientEmail", "==", email)))
        s4.docs.forEach(dedup)
      } catch(e) { console.error("[profil] cmdclients/clientEmail ERREUR:", e.message) }
    }

    if (resolvedUid.value && email) {
      try {
        const s5 = await gd(q(
          col(db, "users", resolvedUid.value, "orders"),
          where("customerEmail", "==", email)))
        s5.docs.forEach(dedup)
      } catch(e) { console.error("[profil] store/orders ERREUR:", e.message) }
    }

    results.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    svClientOrders.value = results
    svOrdersLoaded.value = true

  } catch(e) { console.error("[profil] svLoadOrders ERREUR:", e.message) }
  finally { svLoadingOrders.value = false }
}

const svOpenProfile = async () => {
  svShowProfile.value  = true
  svOrdersLoaded.value = false
  if (svCurrentUser.value) await svLoadOrders(svCurrentUser.value)
}

const initPaypal = async () => {
  const cfg = storePayConfig.value?.paypal
  if (!cfg?.clientId || cfg.clientId.length < 5) {
    payError.value = "Paiement PayPal non configuré pour ce store."
    return
  }
  try {
    if (!window.paypal || window.paypal._clientId !== cfg.clientId) {
      const old = document.getElementById("paypal-sdk")
      if (old) old.remove()
      await new Promise((res, rej) => {
        const s = document.createElement("script")
        s.id  = "paypal-sdk"
        s.src = `https://www.paypal.com/sdk/js?client-id=${cfg.clientId}&currency=${cfg.currency || "EUR"}`
        s.onload = () => { window.paypal._clientId = cfg.clientId; res() }
        s.onerror = rej
        document.head.appendChild(s)
      })
    }
    const container = document.getElementById("sv-paypal-container")
    if (container) container.innerHTML = ""
    await new Promise(r => setTimeout(r, 100))
    window.paypal.Buttons({
      createOrder: async () => {
        if (!cfg.createOrderUrl) throw new Error("createOrderUrl non défini")
        const res = await fetch(cfg.createOrderUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount:   cartTotal.value,
            currency: cfg.currency || "EUR",
            items:    cart.value.map(i => ({ name: i.name, unit_amount: parseFloat(i.price), quantity: i.qty })),
          }),
        })
        const data = await res.json()
        return data.orderID
      },
      onApprove: async (data) => {
        payProcessing.value = true
        if (cfg.captureOrderUrl) {
          const res = await fetch(cfg.captureOrderUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderID: data.orderID }),
          })
          const result = await res.json()
          if (result.status === "COMPLETED") {
            await saveOrder("paypal", result.id)
            paySuccess.value    = true
            payProcessing.value = false
          }
        }
      },
      onError: (err) => { payError.value = "Erreur PayPal : " + String(err) },
    }).render("#sv-paypal-container")
  } catch (e) { payError.value = "Erreur PayPal : " + e.message }
}

watch([showPayModal, payProvider], ([open, provider]) => {
  if (!open) return
  payError.value = ""
  if (provider === "paypal") setTimeout(initPaypal, 150)
})

const payWithStripe = async () => {
  const cfg = storePayConfig.value?.stripe
  if (!cfg?.backendUrl) { payError.value = "backendUrl Stripe non configuré."; return }
  if (!customerName.value || !customerEmail.value) {
    payError.value = "Nom et email obligatoires."; return
  }
  payProcessing.value = true
  payError.value = ""
  try {
    const res = await fetch(cfg.backendUrl + "/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items:    cart.value.map(i => ({ name: i.name, price: parseFloat(i.price), currency: i.currency || "EUR", quantity: i.qty, image: i.image || "" })),
        customerName:  customerName.value,
        customerEmail: customerEmail.value,
        customerAddress: [svAddress.value, svZip.value, svCity.value, svCountry.value].filter(Boolean).join(", "),
        storeUid:      resolvedUid.value,
        successUrl:    window.location.origin + window.location.pathname + "#/payment-success",
        cancelUrl:     window.location.href,
      }),
    })
    const data = await res.json()
    if (data.url) {
      localStorage.setItem("pendingOrder", JSON.stringify({
        items: cart.value, total: cartTotal.value, currency: cartCurrency.value,
        customerName: customerName.value, customerEmail: customerEmail.value,
        storeUid: resolvedUid.value,
      }))
      window.location.href = data.url
    } else {
      payError.value = data.error || "Erreur Stripe"
    }
  } catch(e) {
    payError.value = "Erreur : " + e.message
  } finally {
    payProcessing.value = false
  }
}

const saveOrder = async (provider, transactionId) => {
  try {
    const orderData = {
      items:         cart.value.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
      total:         cartTotal.value,
      currency:      cartCurrency.value,
      provider,
      transactionId,
      customerName:  customerName.value,
      customerEmail: customerEmail.value,
      customerAddress: [svAddress.value, svZip.value, svCity.value, svCountry.value].filter(Boolean).join(", "),
      clientId:      clientAuth.currentUser?.uid || null,
      storeUid:      resolvedUid.value,
      status:        "paid",
      createdAt:     new Date().toISOString(),
    }
    await addDoc(collection(db, "users", resolvedUid.value, "orders"), orderData)
    await addDoc(collection(db, "orders"), orderData)
    cart.value = []
    showCart.value = false
    showPayModal.value = false
  } catch(e) { console.error("saveOrder error:", e) }
}
</script>
