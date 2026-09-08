const state = { history: [] };
const messages = document.querySelector('#messages');
const provider = document.querySelector('#provider');
const model = document.querySelector('#model');
const input = document.querySelector('#message');
function render(role, content) { document.querySelector('#welcome')?.remove(); const el = document.createElement('div'); el.className = `bubble ${role}`; el.textContent = content; messages.append(el); messages.scrollTop = messages.scrollHeight; }
provider.addEventListener('change', () => { model.value = provider.value === 'gemini' ? 'gemini-flash-latest' : provider.value === 'openai' ? 'gpt-4o-mini' : ''; });
document.querySelector('#composer').addEventListener('submit', async (event) => { event.preventDefault(); const message = input.value.trim(); if (!message) return; render('user', message); state.history.push({ role:'user', content:message }); input.value=''; try { const response = await fetch('/api/chat', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ message, history:state.history.slice(0,-1), provider:provider.value, model:model.value.trim() }) }); const data=await response.json(); const reply=data.reply||data.error||'ไม่พบข้อความตอบกลับ'; render('assistant',reply); state.history.push({role:'assistant',content:reply}); } catch { render('assistant','เชื่อมต่อ backend ไม่สำเร็จ'); } });