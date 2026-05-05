<script setup>
import { useClient } from '@/@core/stores/client'
import { VForm } from 'vuetify/components/VForm'

const store = useClient()

definePage({
    meta: {
        action: 'read',
        subject: 'AclDemo',
    }
})
const refForm = ref()

const clientData = ref({
    operator: null, //✅
    typeCert: 'dfgg', //✅
    typeClient: null, //✅
    cert_type: 'dfgf', //✅
    local_code: 'fdgdf', //✅

    cname: 'dfgfd', //✅
    sname: 'fgd',  //✅
    iabsID: 'fdg',  //✅ 
    password: 123456,
    location: 'test',
    state: 'state',
    country: 'UZ',
    address: 'addres',
    email: 'emailll@gmail.com',
    organization: 'test',
    phone: '1233456789',
    ou: 'jadskl',
    inn: 'asd',
    pinfl: 'adsfa',

    accname: 'fasdf',
    job: 'dsdfsdf',
    token_type: null,
    token_sn: '',
    token_serialnumber: '2345',
    csr: 'sdfd',
    container: 'sdfdfs',
    fileToUpload: null,

})




// 'operator'          => ['nullable', 'string'],
//   'typeCert'          => ['nullable', 'string'],
//   'typeClient'        => ['nullable', 'string'],
//   'cert_type'         => ['nullable', 'string'],
//   'local_code'        => ['nullable', 'string'],

//   'cname'             => ['required', 'string', 'max:100'],
//   'sname'             => ['nullable', 'string', 'max:100'],
//   'iabsID'            => ['required', 'string'],
//   'password'          => ['required', 'string', 'min:8'],
//   'location'          => ['required', 'string'],
//   'state'             => ['required', 'string'],
//   'country'           => ['required', 'string'],
//   'address'           => ['required', 'string'],
//   'email'             => ['required', 'email', 'unique:clients,email'],
//   'organisation'      => ['required', 'string'],
//   'phone'             => ['required', 'numeric', 'digits:12'],
//   'ou'                => ['required', 'string'],
//   'inn'               => ['nullable', 'string'],
//   'pinfl'             => ['nullable', 'string'],

//   'accname'           => ['nullable', 'string'],
//   'job'               => ['nullable', 'string'],
//   'token_type'        => ['nullable', 'string'],
//   'token_sn'          => ['nullable', 'string'],
//   'token_serialnumber'=> ['nullable', 'string'],
//   'csr'               => ['nullable', 'string'],
//   'container'         => ['nullable', 'string'],
//   'fileToUpload'      => ['required', 'file', 'mimes:pdf', 'max:10240'],


const onSubmit = () => {

    refForm.value?.validate().then(({ valid }) => {

        const formData = new FormData()
        console.log(clientData.value.fileToUpload, 'fileToUpload');


        for (const key in clientData.value) {
            const value = clientData.value[key]

            // Agar fayl bo‘lsa va null bo‘lmasa, append qilamiz
            if (key === 'fileToUpload' && value) {
                console.log(value[0]);

                formData.append(key, value[0])
            }
            // Oddiy qiymatlar uchun
            else if (value !== undefined && value !== null) {
                formData.append(key, value)
            }
        }





        if (valid) {

            store.createClients(formData)
            // .then(res => {


            //     // handleSuccess()



            // }).catch(error => {
            //     console.log(error, 'errror');

            //     // storeToast.errorToast(error.response._data.message)
            // })




        } else {
            // storeToast.errorToast(t('required_fiels'))


        }
    })
}

const token_type = [
    { value: 'ePass/iKey', label: 'ePass/iKey' },
    { value: 'virtual', label: 'Virtual token' },
    { value: 'smartcard', label: 'BST' },]



const operator = [
    { value: '1', label: 'admin' },
    { value: '3', label: 'limited' },
    { value: '4', label: 'operator' },
]



const typeClient = [
    { value: '1', label: 'Юридическое лицо' },
    { value: '2', label: 'Физическое лицо' },
]


const typeCert = [
    { value: '2', label: 'Интернет банкинг' },
    { value: '5', label: 'Мобильный банкинг Metin' },
    { value: '4', label: 'Мобильный банкинг iABS' },
    { value: '3', label: 'Мобильный банкинг PFX' },
    { value: '1', label: 'Пользователь iABS' },
]


</script>

<template>

    <VCard title="Add Client" class="py-6 px-6">
        <VForm ref="refForm" @submit.prevent="onSubmit">
            <VRow>

                <!-- iabsID  -->
                <VCol cols="12" md="6">
                    <AppTextField v-model="clientData.iabsID" :rules="[requiredValidator]" label="IABS ID"
                        :requireInput="true" />
                </VCol>

                <!-- operator  -->
                <VCol cols="12" md="6">
                    <AppSelect v-model="clientData.operator" label="Operator" :items="operator" item-title="label"
                        item-value="value" />
                </VCol>

                <!-- typeCert  -->
                <VCol cols="12" md="6">
                    <AppSelect v-model="clientData.typeCert" label="typeCert" :items="typeCert" item-title="label"
                        item-value="value" />
                </VCol>

                <!-- typeClient -->
                <VCol cols="12" md="6">
                    <AppSelect v-model="clientData.typeClient" label="typeClient" :items="typeClient" item-title="label"
                        item-value="value" />
                </VCol>


                <!-- cname -->
                <VCol cols="12" md="6">
                    <AppTextField v-model="clientData.cname" :rules="[requiredValidator]" :requireInput="true"
                        label="Cname" />
                </VCol>

                <!-- city location  -->
                <VCol cols="12" md="6">
                    <AppTextField v-model="clientData.location" label="Location" :requireInput="true"
                        :rules="[requiredValidator]" />
                </VCol>

                <!-- country -->
                <VCol cols="12" md="6">
                    <AppTextField v-model="clientData.country" :rules="[requiredValidator]" :requireInput="true"
                        label="Страна (двухбуквенный индекс) (C)" />
                </VCol>

                <!-- state  -->
                <VCol cols="12" md="6">
                    <AppTextField v-model="clientData.state" persistent-placeholder label="oblast"
                        :rules="[requiredValidator]" :requireInput="true" />
                </VCol>

                <!-- address  -->
                <VCol cols="12" md="6">
                    <AppTextField v-model="clientData.address" :rules="[requiredValidator]" :requireInput="true"
                        label="Address" />
                </VCol>

                <!-- email -->
                <VCol cols="12" md="6">
                    <AppTextField v-model="clientData.email" :rules="[requiredValidator, emailValidator]"
                        :requireInput="true" label="Email" />
                </VCol>


                <!-- organisation  -->
                <VCol cols="12" md="6">
                    <AppTextField v-model="clientData.organisation" :rules="[requiredValidator]" :requireInput="true"
                        label="Organisation" />
                </VCol>


                <!-- organisation ou  -->
                <VCol cols="12" md="6">
                    <AppTextField v-model="clientData.ou" label="organisation OU" :requireInput="true"
                        :rules="[requiredValidator]" />
                </VCol>
                <!-- phone  -->
                <VCol cols="12" md="6">
                    <AppTextField v-model="clientData.phone"
                        :rules="[requiredValidator, minLengthValidator(clientData.phone, 12)]" label="Phone"
                        :requireInput="true" type="number" />
                </VCol>

                <!-- type token  -->
                <VCol cols="12" md="6">
                    <AppSelect v-model="clientData.token_type" label="type token" item-title="label" item-value="value"
                        :items="token_type" />
                </VCol>

                <!-- token_sn -->
                <VCol cols="12" md="6">
                    <AppTextField v-model="clientData.token_serialnumber" label="token_serialnumber"
                        append-inner-icon="tabler-dots-vertical" :rules="[requiredValidator]" :requireInput="true"
                        @click="console.log('test')" />
                </VCol>





                <!-- file upload  -->
                <VCol cols="12" md="6">
                    <label>Прикрепить файл запроса<span class="asterisk">*</span>
                    </label>
                    <VFileInput v-model="clientData.fileToUpload" color="primary" variant="outlined"
                        :rules="[requiredValidator]" />
                </VCol>

                <VCol cols="12">
                    <VBtn type="submit">
                        Submit
                    </VBtn>
                </VCol>
            </VRow>
        </VForm>
    </VCard>
</template>


<style lang="scss">
.custom-file-upload {
    // border: 2px solid #d1d5db;
    border-radius: 6px;
    margin-top: 4px;
    display: flex;
    align-items: center;
    align-items: center;
    justify-content: flex-start;
    cursor: pointer;

}

.custom-file-upload label {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    color: #4b5563;
    width: 100%;
    padding: 9px;
}

.asterisk {
    color: #ea5455;
}
</style>
