<!-- 🔥 TOP BAR GLOBAL -->
<div
  v-if="mode==='edit'"
  class="fixed top-0 left-0 w-full bg-white border-b p-2 z-50 flex justify-between items-center flex-wrap gap-2"
>

  <!-- LEFT : SECTIONS -->
  <div class="flex gap-2 flex-wrap">

    <button @click="addSection('hero')" class="border px-2">Hero</button>
    <button @click="addSection('text')" class="border px-2">Text</button>
    <button @click="addSection('main')" class="border px-2">Main</button>
    <button @click="addSection('menu')" class="border px-2">Menu</button>
    <button @click="addSection('image')" class="border px-2">Image</button>
    <button @click="addSection('gallery')" class="border px-2">Gallery</button>
    <button @click="addSection('video')" class="border px-2">Video</button>
    <button @click="addSection('footer')" class="border px-2">Footer</button>

  </div>

  <!-- CENTER : FORMAT -->
  <div v-if="activeSectionIndex !== null" class="flex gap-2 items-center">

    <button @click="setStyle(site.sections[activeSectionIndex],'bold')" class="border px-2">B</button>
    <button @click="setStyle(site.sections[activeSectionIndex],'italic')" class="border px-2">I</button>
    <button @click="setStyle(site.sections[activeSectionIndex],'underline')" class="border px-2">U</button>

    <button @click="setAlign(site.sections[activeSectionIndex],'left')" class="border px-2">⬅</button>
    <button @click="setAlign(site.sections[activeSectionIndex],'center')" class="border px-2">⬌</button>
    <button @click="setAlign(site.sections[activeSectionIndex],'right')" class="border px-2">➡</button>

    <input type="color" @input="e => setColor(site.sections[activeSectionIndex], e)" />
    <input type="color" @input="e => setBg(site.sections[activeSectionIndex], e)" />

  </div>

  <!-- RIGHT : ACTIONS -->
  <div class="flex gap-2">

    <button @click="saveSite" class="bg-green-600 text-white px-3">
      💾 Save
    </button>

    <button @click="mode='preview'" class="bg-blue-600 text-white px-3">
      👁 Preview
    </button>

  </div>

</div>
