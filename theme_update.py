import re

file_path = "c:/Users/HP/nigaban/nigehbaan-app/src/App.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace background colors
content = re.sub(r'bg-white(\b|/[0-9]+)', r'bg-white/5 backdrop-blur-md', content)
content = re.sub(r'bg-stone-50\b', r'bg-[#141523]', content)
content = re.sub(r'bg-stone-100\b', r'bg-white/10', content)
content = re.sub(r'bg-stone-200\b', r'bg-white/20', content)
content = re.sub(r'bg-stone-950\b', r'bg-black', content)

# Violet backgrounds
content = re.sub(r'bg-violet-50/40\b', r'bg-white/5', content)
content = re.sub(r'bg-violet-50/50\b', r'bg-white/5', content)
content = re.sub(r'bg-violet-50\b', r'bg-white/5', content)
content = re.sub(r'bg-violet-100\b', r'bg-white/10', content)
content = re.sub(r'bg-violet-900\b', r'bg-gradient-to-r from-pink-500 to-purple-600 border-none shadow-lg shadow-purple-500/25', content)
content = re.sub(r'bg-gradient-to-br from-violet-900 via-purple-800 to-fuchsia-800\b', r'bg-gradient-to-br from-[#2b1b54] to-[#3b185f]', content)
content = re.sub(r'bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50\b', r'bg-[#141523]/80', content)

# Text colors
content = re.sub(r'text-stone-900\b', r'text-white', content)
content = re.sub(r'text-stone-800\b', r'text-slate-200', content)
content = re.sub(r'text-stone-700\b', r'text-slate-300', content)
content = re.sub(r'text-stone-600\b', r'text-slate-400', content)
content = re.sub(r'text-stone-500\b', r'text-slate-400', content)
content = re.sub(r'text-stone-400\b', r'text-slate-500', content)

content = re.sub(r'text-violet-900\b', r'text-purple-300', content)
content = re.sub(r'text-violet-800\b', r'text-purple-400', content)
content = re.sub(r'text-violet-700\b', r'text-pink-400', content)
content = re.sub(r'text-violet-100\b', r'text-purple-200', content)

# Border colors
content = re.sub(r'border-violet-200\b', r'border-white/10', content)
content = re.sub(r'border-violet-300\b', r'border-white/20', content)
content = re.sub(r'border-stone-200\b', r'border-white/10', content)
content = re.sub(r'border-stone-300\b', r'border-white/20', content)

# Fix double classes created by naive regex
content = content.replace("bg-white/5 backdrop-blur-md/10", "bg-white/10 backdrop-blur-md")
content = content.replace("bg-white/5 backdrop-blur-md/20", "bg-white/20 backdrop-blur-md")
content = content.replace("bg-white/5 backdrop-blur-md/40", "bg-white/5 backdrop-blur-md")
content = content.replace("bg-white/5 backdrop-blur-md/50", "bg-white/5 backdrop-blur-md")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("App.jsx theme updated.")
