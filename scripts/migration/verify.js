const _ = require('lodash')
const mongoist = require('mongoist');
const db = mongoist("mongodb://localhost:27017/diginex-trust",)
debug = 1

async function verify() {
  let sharings = await db.sharings.find({})
  sharings.map(async sharing => {
    // console.log('sharing.formId', sharing.formId);
    let fileId = sharing.fileId
    let file = await db.files.findOne({_id: fileId})
    let user = await db.users.findOne({_id: file.user})
    if (sharing.formId){
      await Promise.all(sharing.formId.map(async fid => {
        let forms = await db.forms.find({_id: fid})
        await Promise.all(forms.map(async form => {
          let template = await db.templates.findOne({_id: form.templateId})
          let templateUser = await db.users.findOne({_id: template.userId})
          if(!String(form.sharingId)=== String(sharing._id) || !String(templateUser._id) === String(user._id)) {
            console.log('mismatch', String(form.sharingId), String(sharing._id), String(form.sharingId)=== String(sharing._id), templateUser._id, user._id,  String(templateUser._id)=== String(user._id));
          }
        }))
      }))
    }
  })
}

async function main() {
  ids = await verify()
  console.log('exiting');
}

main()
