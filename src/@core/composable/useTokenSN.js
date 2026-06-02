// src/@core/composables/useTokenSN.js

export const useTokenSN = (clientData) => {
    const loading = ref(false)

    const cyrillicToLatin = (str) => {
        if (!str) return ''
        const map = {
            'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'j',
            'з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o',
            'п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'x','ц':'ts',
            'ч':'ch','ш':'sh','щ':'sch','ъ':"'",'ы':'y','ь':"'",'э':'e',
            'ю':'yu','я':'ya',
            'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Ё':'Yo','Ж':'J',
            'З':'Z','И':'I','Й':'Y','К':'K','Л':'L','М':'M','Н':'N','О':'O',
            'П':'P','Р':'R','С':'S','Т':'T','У':'U','Ф':'F','Х':'X','Ц':'Ts',
            'Ч':'Ch','Ш':'Sh','Щ':'Sch','Э':'E','Ю':'Yu','Я':'Ya',
        }
        return str.split('').map(c => map[c] ?? c).join('')
    }

    const buildPayload = (tokenType) => {
        const d = clientData.value
        const isBst = tokenType === 'BST' || tokenType === 'smartcard'

        const required = [d.cname, d.location, d.state, d.country, d.address, d.email, d.organisation, d.org_unit]
        if (isBst && required.some(v => !v)) return null

        if (isBst) {
            // Keep the request shape aligned with legacy branch_add_client.php,
            // because the local websocket service relies on these exact keys.
            return {
                function: 'getTokenSN',
                token_type: 'BAIK',
                subject: {
                    email: cyrillicToLatin(d.email),
                    commonName: cyrillicToLatin(d.cname),
                    organisationUnit: d.org_unit,
                    organisation: cyrillicToLatin(d.organisation),
                    street: cyrillicToLatin(d.address),
                    locality: cyrillicToLatin(d.location),
                    state: cyrillicToLatin(d.state),
                    country: d.country,
                    uzINN: d.inn ?? '',
                    uzPINFL: d.pinfl ?? '',
                },
            }
        }

        return {
            function: 'getTokenSN',
            token_type: 'ePass/iKey',
            status: 0,
        }
    }

    const getTokenSN = (tokenType = 'ePass/iKey') => {
        return new Promise((resolve, reject) => {
            const payload = buildPayload(tokenType)
            const isBst = tokenType === 'BST' || tokenType === 'smartcard'

            if (!payload) {
                reject(new Error('fill_fields'))
                return
            }

            loading.value = true
            const ws = new WebSocket('ws://localhost:8181')

            ws.onopen = () => {
                ws.send(JSON.stringify(payload))
            }

            ws.onmessage = (evt) => {
                let obj

                try {
                    obj = JSON.parse(evt.data)
                } catch {
                    reject(new Error('invalid_ws_response'))
                    loading.value = false
                    ws.close()
                    return
                }

                const isError = obj?.result === 'error' || obj?.status === 'error'
                const errorComment = obj?.comment || obj?.comments || 'unknown_ws_error'

                if (isError) {
                    if (errorComment === 'check cert') {
                        // Normalize to array for safe iteration in caller.
                        reject({ type: 'check_cert', certSnArr: Array.isArray(obj?.cert_snArr) ? obj.cert_snArr : [] })
                    } else {
                        reject(new Error(errorComment))
                    }
                } else {
                    clientData.value.token_sn = obj?.var1 ?? ''
                    clientData.value.csr = isBst ? (obj?.var2 ?? '') : ''
                    clientData.value.container = obj?.var3 ?? ''
                    resolve(obj)
                }

                loading.value = false
                ws.close()
            }

            ws.onerror = () => {
                loading.value = false
                reject(new Error('ws_error'))
                ws.close()
            }

            ws.onclose = () => {
                loading.value = false
            }
        })
    }

    return { getTokenSN, loading }
}
