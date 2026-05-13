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
        const required = [d.cname, d.location, d.state, d.country, d.address, d.email, d.organisation, d.org_unit]
        if (required.some(v => !v)) return null

        if (tokenType === 'BST') {
            return {
                function: 'getTokenSN',
                type: 'BST',
                subject: {
                    Email:    d.email,
                    CN:       cyrillicToLatin(d.cname),
                    OrgUnit:  d.org_unit,
                    Org:      cyrillicToLatin(d.organisation),
                    Address:  cyrillicToLatin(d.address),
                    Locality: cyrillicToLatin(d.location),
                    State:    cyrillicToLatin(d.state),
                    Country:  d.country,
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
                const obj = JSON.parse(evt.data)

                if (obj.result === 'error') {
                    if (obj.comment === 'check cert') {
                        // mavjud sertifikatlar tekshiruvi — reject qilib yuqoriga ko'tarish
                        reject({ type: 'check_cert', certSnArr: obj.cert_snArr })
                    } else {
                        reject(new Error(obj.comment))
                    }
                } else {
                    clientData.value.token_sn  = obj.var1
                    clientData.value.csr       = obj.var2
                    clientData.value.container = obj.var3
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
