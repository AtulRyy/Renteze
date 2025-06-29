const mongoose=require('mongoose')


const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  subject: String,
  body: String,
  status: {
    type: String,
    enum: ['open', 'responded', 'closed'],
    default: 'open'
  },
  createdAt: { type: Date, default: Date.now },
  responses: [{
    responder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    createdAt: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('Message', MessageSchema);