// AI Generated code. This is what was added to tomato.js
(function(){
	function asp() {
		var m = location.pathname.match(/\/([^\/?#]+\.asp)\b/i);
		return m ? m[1] : "";
	}
	function skipPage() {
		var a = asp();
		return /^status\-.+\.asp$/i.test(a) || /^about\.asp$/i.test(a) || /^tools\-.+\.asp$/i.test(a);
	}
	function getNextpage() {
		var f = (window.fields && fields.getAll) ? fields.getAll(document.body) : [];
		for (var i = 0; i < f.length; ++i)
			if (f[i].name === "_nextpage" && f[i].value)
				return f[i].value;
		var a = asp();
		return a ? a.replace(/[\.\-]/g, "_") : "";
	}
	// PATCHED: Now detects grid data even if columns are readonly (e.g. forward-basic.asp)
	function hasBackupData() {
		var f = (window.fields && fields.getAll) ? fields.getAll(document.body) : [];
		for (var i = 0, x; i < f.length; ++i) {
			x = f[i];
			if (x.name && !x.readOnly && !x.disabled && x.type !== "hidden" && x.name !== "_nextpage")
				return true;
		}
		var t = document.getElementsByTagName('table');
		for (var i = 0; i < t.length; ++i) {
			var g = t[i].gridObj;
			if (g && g.getAllData) {
				var data = g.getAllData();
				if (Array.isArray(data) && data.length) return true;
			}
		}
		return false;
	}
	function getModelVersion() {
		var m="",v="",td=document.querySelectorAll("#header td");
		for(var i=0;i<td.length;++i){
			var t=td[i].textContent.trim();
			var mm=t.match(/\b([A-Z0-9][A-Z0-9\-]{4,})\b/), vv=t.match(/(20\d{2}\.\d{1,2})/);
			if(!m&&mm)m=mm[1]; if(!v&&vv)v=vv[1]; if(m&&v)break;
		}
		if(!m||!v){
			var h=(window.E && E("header"))||(document.querySelector&&document.querySelector("#header"))||document.querySelector(".header");
			if(h){
				var t=h.textContent;
				if(!m){var mm=t.match(/\b([A-Z0-9][A-Z0-9\-]{4,})\b/);if(mm)m=mm[1];}
				if(!v){var vv=t.match(/(20\d{2}\.\d{1,2})/);if(vv)v=vv[1];}
			}
		}
		if(!m){var mt=(document.title||"").match(/\b([A-Z0-9][A-Z0-9\-]{4,})\b/);if(mt)m=mt[1];}
		m=(m||"unknown").replace(/[^a-zA-Z0-9_\-\.]+/g,"_");
		v=(v||"unknown").replace(/[^a-zA-Z0-9_\-\.]+/g,"_");
		return {model:m,version:v};
	}

	function backup() {
		if (skipPage()) { alert("No backup for this page."); return; }
		if (!hasBackupData()) { alert("Nothing to backup on this page."); return; }
		var np = getNextpage();
		if (!np) { alert("Unable to detect page name (_nextpage or filename)"); return; }
		var b = {nextpage:np,fields:{},grids:{}};
		var f = (window.fields && fields.getAll) ? fields.getAll(document.body) : [];
		for (var i = 0, x; i < f.length; ++i) {
			x = f[i];
			if (!x.name || x.readOnly || x.disabled || x.type === "hidden") continue;
			b.fields[x.name] = (x.type === "checkbox" || x.type === "radio") ? x.checked : x.value;
		}
		var t = document.getElementsByTagName('table');
		for (var i = 0; i < t.length; ++i) {
			var tbl = t[i], g = tbl.gridObj;
			if (g && g.getAllData) {
				var id = tbl.id || ("grid" + i),
					rows = g.getAllData(), cols = [];
				if (g.columns) for (var j = 0; j < g.columns.length; ++j)
					if (!g.columns[j].readonly && g.columns[j].edit !== false) cols.push(j);
				b.grids[id] = rows.map(function(r) {
					if (!Array.isArray(r) || !cols.length) return r;
					for (var d=[],k=0; k<cols.length; ++k) d.push(r[cols[k]]);
					return d;
				});
			}
		}
		var meta = getModelVersion(),
			pg = np.replace(/[^a-zA-Z0-9_-]+/g, "_") || "unknown",
			d = new Date(),
			ts = d.getFullYear()+"-"+(("0"+(d.getMonth()+1)).slice(-2))+"-"+(("0"+d.getDate()).slice(-2))+"_"+(("0"+d.getHours()).slice(-2))+(("0"+d.getMinutes()).slice(-2)),
			fn = meta.model+"-"+meta.version+"-"+pg+"-backup-"+ts+".json",
			j = JSON.stringify(b, null, 2),
			a = document.createElement('a');
		a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(j);
		a.download = fn;
		a.style.display = 'none';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		// No success popup!
	}
	function restore(j) {
		if (skipPage()) { alert("No restore for this page."); return; }
		var b;
		try { b = (typeof j == "string") ? JSON.parse(j) : j; }
		catch(e) { alert("Invalid backup JSON."); return; }
		var currNext = getNextpage();
		if (!currNext) { alert("Cannot restore: missing _nextpage field or filename."); return; }
		if (b.nextpage !== currNext) {
			alert("Restore denied!\nThis backup is for '"+(b.nextpage||"unknown")+"',\nbut this page is '"+currNext+"'.");
			return;
		}
		var f = (window.fields && fields.getAll) ? fields.getAll(document.body) : [],
			restored = 0, skipped = 0, total = 0, missing = [],
			warnings = [];
		if (b.fields) for (var i = 0, x; i < f.length; ++i) {
			x = f[i];
			if (!x.name || x.readOnly || x.disabled || x.type === "hidden") continue;
			total++;
			if (!(x.name in b.fields)) { missing.push(x.name); skipped++; continue; }
			try {
				if (x.type === "checkbox" || x.type === "radio") x.checked = !!b.fields[x.name];
				else x.value = b.fields[x.name];
				restored++;
			} catch(e) { skipped++; }
		}
		var gr = 0, gs = 0;
		if (b.grids) {
			var t = document.getElementsByTagName('table');
			for (var i = 0; i < t.length; ++i) {
				var tbl = t[i], g = tbl.gridObj, id = tbl.id || ("grid"+i);
				if (g && g.insertData && Array.isArray(b.grids[id])) {
					try {
						var enableBox = null;
						var p = tbl;
						for (var lvl=0; lvl<2 && p; ++lvl) {
							var ebs = p.querySelectorAll && p.querySelectorAll('input[type=checkbox][name*="enable"]');
							if (ebs && ebs.length) { enableBox = ebs[0]; break; }
							p = p.parentNode;
						}
						if (enableBox && enableBox.disabled) {
							enableBox.disabled = false;
							enableBox.checked = true;
							warnings.push("Enabled a section to allow grid restore (checkbox '"+enableBox.name+"').");
						}
						if (g.removeAllData) g.removeAllData();
						b.grids[id].forEach(function(r){ g.insertData(-1, r); });
						gr++;
						if (typeof g.getAllData === "function" && g.getAllData().length > b.grids[id].length) {
							var nrm = g.getAllData().length-b.grids[id].length;
							for (var rm=0; rm<nrm; ++rm) if (g.removeRow) g.removeRow(g.getAllData().length-1);
						}
					} catch(e) { gs++; }
				}
			}
		}
		var msg = "Restored "+restored+" field(s) of "+total+".\n";
		if (skipped) msg += skipped+" field(s) skipped.\n";
		if (gr) msg += "Restored "+gr+" TomatoGrid table(s).\n";
		if (gs) msg += gs+" TomatoGrid(s) could not be restored.\n";
		if (missing.length) msg += "Missing fields: "+missing.slice(0,10).join(", ")+(missing.length>10?"...":"");
		if (warnings.length) msg += "\n\nWarnings:\n- " + warnings.join("\n- ");
		alert(msg);
	}

	function addUI() {
		if (skipPage()) return;
		if (document.getElementById("tomato-backup-restore-ui")) return;
		var advanced = !!(document.querySelector('link[href*="at.css"]') ||
			document.body.classList.contains("at-theme") ||
			(document.getElementById("header") && /at/i.test(document.getElementById("header").className)) ||
			document.body.classList.contains("dark-theme") ||
			(document.documentElement && document.documentElement.classList.contains("dark-theme"))
		);

		// Style: center bar, not full width, subtle shadow, classic look.
		if (!document.getElementById("tomato-backup-restore-style")) {
			var s = document.createElement('style');
			s.id = "tomato-backup-restore-style";
			s.textContent =
				"#tomato-backup-restore-ui{box-sizing:border-box;position:relative;display:block;width:100%;margin:0 0 18px 0;z-index:1002;}"+
				"#tomato-backup-restore-ui .tbu-card{margin:0 auto;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;max-width:650px;background:var(--content-bg,#fdfdfd);border:1.5px solid #b9b9b9;border-radius:8px;padding:12px 14px 10px 14px;box-shadow:0 1.5px 6px 0 rgba(80,80,80,.05);}"+
				"#tomato-backup-restore-ui.advanced .tbu-card{background:var(--at-bg,#181a1b);border:1.5px solid var(--at-border,#313233);color:var(--at-fg,#e0e0e3);}"+
				"#tomato-backup-restore-ui.advanced .tbu-btn{background:var(--at-btn-bg,#232628);color:var(--at-btn-fg,#f0f0f2);border:1.2px solid var(--at-btn-border,#515255);}"+
				"#tomato-backup-restore-ui.advanced .tbu-btn:hover{background:var(--at-btn-bg-hover,#323438);border-color:var(--at-btn-border-hover,#888);}"+
				"#tomato-backup-restore-ui .tbu-group{display:flex;gap:10px;}"+
				"#tomato-backup-restore-ui .tbu-btn{font-family:inherit;display:inline-block;padding:6px 18px;font-size:15px;line-height:1.2;color:var(--button-text,#222);background:linear-gradient(0deg,#e6e6e6,#f9f9f9);border:1.25px solid var(--button-border,#b9b9b9);border-radius:4px;box-shadow:0 1.5px 2.5px 0 rgba(180,180,180,0.02);cursor:pointer;transition:background .13s,border .13s;}"+
				"#tomato-backup-restore-ui .tbu-btn:hover{background:linear-gradient(0deg,#fff,#e6e6e6);border-color:#888;}"+
				"#tomato-backup-restore-ui .tbu-title{font-size:15.5px;font-weight:600;letter-spacing:.02em;flex:1 1 auto;}"+
				"#tomato-backup-restore-ui .tbu-hide-btn{display:inline-block;background:none;border:none;color:#888;font-size:18px;font-weight:bold;cursor:pointer;padding:2px 7px;opacity:.78;margin-left:9px;line-height:1.1;transition:color .13s;}"+
				"#tomato-backup-restore-ui .tbu-hide-btn:hover{color:#222;opacity:1;}"+
				"@media (max-width:650px){#tomato-backup-restore-ui .tbu-card{padding:7px 2px;}}";
			document.head.appendChild(s);
		}
		var c = document.createElement('div');
		c.id = "tomato-backup-restore-ui";
		if(advanced) c.className = "advanced";
		var card = document.createElement('div');
		card.className = "tbu-card";
		var title = document.createElement('span');
		title.className = "tbu-title";
		title.textContent = "Backup/Restore Page Data";
		card.appendChild(title);
		var grp = document.createElement('div');
		grp.className = "tbu-group";
		var b1 = document.createElement('button');
		b1.type = "button";
		b1.className = "tbu-btn";
		b1.textContent = "Backup";
		b1.onclick = backup;
		var b2 = document.createElement('button');
		b2.type = "button";
		b2.className = "tbu-btn";
		b2.textContent = "Restore";
		var fi = document.createElement('input');
		fi.type = 'file';
		fi.accept = 'application/json,application/octet-stream,text/plain';
		fi.style.display = 'none';
		b2.onclick = function(){ fi.click(); };
		fi.onchange = function(e){
			var f = e.target.files[0];
			if (!f) return;
			var r = new FileReader();
			r.onerror = function(){ alert("Failed to read backup file."); };
			r.onload = function(x){ try { restore(x.target.result); } catch(ex) { alert("Restore failed: "+(ex.message||ex)); } };
			r.readAsText(f);
			fi.value = "";
		};
		grp.appendChild(b1);
		grp.appendChild(b2);
		grp.appendChild(fi);
		card.appendChild(grp);
		var hideBtn = document.createElement('button');
		hideBtn.type = "button";
		hideBtn.className = "tbu-hide-btn";
		hideBtn.title = "Hide backup/restore bar";
		hideBtn.setAttribute("aria-label", "Hide backup/restore");
		hideBtn.innerHTML = "&#x2715;";
		hideBtn.onclick = function(){
			c.style.display = "none";
		};
		card.appendChild(hideBtn);
		c.appendChild(card);
		c.style.display = "none"; // HIDDEN BY DEFAULT
		// Insert after header (for classic Tomato), or at top of body
		var header = document.getElementById("header");
		if (header && header.nextSibling) {
			header.parentNode.insertBefore(c, header.nextSibling);
		} else {
			document.body.insertBefore(c, document.body.firstChild);
		}
		addDisketteIcon();
	}

	function addDisketteIcon() {
		if (document.getElementById('tbu-bar-toggle')) return;
		var ident = document.getElementById("ident");
		if (!ident) return;
		var wiki = ident.querySelector('a[href*="wiki"]');
		var sep = document.createElement("span");
		sep.textContent = "|";
		sep.style.marginLeft = "8px";
		sep.style.color = "#888";
		sep.style.userSelect = "none";
		var icon = document.createElement('span');
		icon.id = 'tbu-bar-toggle';
		icon.title = 'Show/Hide Backup & Restore Bar';
		icon.style.cursor = 'pointer';
		icon.style.marginLeft = '3px';
		icon.style.fontSize = '8px';
		icon.style.verticalAlign = 'middle';
		icon.style.userSelect = "none";
		icon.style.color = "inherit";
		icon.setAttribute('tabindex', '0');
		icon.setAttribute('role', 'button');
		icon.setAttribute('aria-label', 'Show/Hide Backup & Restore Bar');
		icon.innerText = "💾";
		icon.addEventListener("click", function(e) {
			var bar = document.getElementById('tomato-backup-restore-ui');
			if (bar) {
				if (bar.style.display === "none" || bar.style.display === "") {
					bar.style.display = "block";
				} else {
					bar.style.display = "none";
				}
			}
			e.stopPropagation();
		});
		icon.addEventListener("keydown", function(e){
			if(e.key==="Enter"||e.key===" "){e.preventDefault(); icon.click();}
		});
		if (wiki && wiki.parentNode) {
			if (wiki.nextSibling) {
				wiki.parentNode.insertBefore(sep, wiki.nextSibling);
				wiki.parentNode.insertBefore(icon, sep.nextSibling);
			} else {
				wiki.parentNode.appendChild(sep);
				wiki.parentNode.appendChild(icon);
			}
		} else {
			ident.appendChild(sep);
			ident.appendChild(icon);
		}
	}
	if (document.readyState === "complete" || document.readyState === "interactive")
		setTimeout(addUI, 0);
	else
		window.addEventListener("DOMContentLoaded", addUI);
})();
