const fs = require('fs');

const origPath = 'src/app/(officer)/(ais-officer)/reimbursement/medical/[mrId]/workspace-client.tsx';
let data = fs.readFileSync(origPath, 'utf8');

// Replace the broken effect with the correct one.
const regex = /useEffect\(\(\) => \{\n\s*if \(\!c \|\| \!treatmentDraft\.hospitalised \|\| \!hospitalFocused\) return;[\s\S]*?return \(\) => clearTimeout\(timer\);\n\s*\}, \[treatmentDraft\.hospitalName, treatmentDraft\.hospitalised, hospitalFocused\]\);/g;

const correctEffect = `useEffect(() => {
    if (!c || !treatmentDraft.hospitalised || !hospitalFocused) return;

    if (skipAutocompleteRef.current) {
      skipAutocompleteRef.current = false;
      return;
    }

    const q = hospitalQuery.trim();
    if (q.length < 3) {
      setHospitalOptions([]);
      return;
    }

    const ctrl = new AbortController();

    const timer = window.setTimeout(async () => {
      setHospitalLoading(true);
      try {
        const url = \`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=in&limit=6&q=\${encodeURIComponent(\`\${q} hospital\`)}\`;
        const res = await fetch(url, {
          signal: ctrl.signal,
          headers: { Accept: 'application/json' },
        });

        const data = await res.json();

        const opts = Array.isArray(data)
          ? data.map((item: any) => ({
              name: String(item?.name || item?.display_name?.split(',')[0] || 'Hospital'),
              address: String(item?.display_name || ''),
            }))
          : [];

        setHospitalOptions(opts.filter((o) => o.address));
      } catch {
        if (!ctrl.signal.aborted) setHospitalOptions([]);
      } finally {
        if (!ctrl.signal.aborted) setHospitalLoading(false);
      }
    }, 320);

    return () => {
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, [c, treatmentDraft.hospitalised, hospitalFocused, hospitalQuery]);`;

data = data.replace(regex, correctEffect);

// The original component had `updateCase` etc. right below the effect, let's make sure they aren't deleted.
// Wait, the user mentioned we need to define those. It implies they are MISSING from the current file!
// Let's check if `onBillUpload` is in the file.
fs.writeFileSync(origPath, data);
