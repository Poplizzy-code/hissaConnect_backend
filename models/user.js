// const mongoose = require('mongoose');
// const bcryptjs = require('bcryptjs');

// const userSchema = new mongoose.Schema(
//   {
//     firstName: {
//       type: String,
//       required: [true, 'Please provide a first name'],
//       trim: true,
//     },
//     lastName: {
//       type: String,
//       required: [true, 'Please provide a last name'],
//       trim: true,
//     },
//     email: {
//       type: String,
//       required: [true, 'Please provide an email'],
//       unique: true,
//       lowercase: true,
//       match: [/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/, 'Please provide a valid email'],
//     },
//     password: {
//       type: String,
//       required: [true, 'Please provide a password'],
//       minlength: 6,
//       select: false, // Don't return password by default
//     },
//     role: {
//       type: String,
//       enum: ['student', 'moderator', 'instructor', 'admin'],
//       default: 'student',
//     },
//     phone: {
//       type: String,
//       default: null,
//     },
//     bio: {
//       type: String,
//       default: null,
//       maxlength: 500,
//     },
//     profilePhoto: {
//       type: String,
//       default: null,
//     },
//     courseEnrolled: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Course',
//       },
//     ],
//     isEmailVerified: {
//       type: Boolean,
//       default: false,
//     },
//     subscriptionStatus: {
//       type: String,
//       enum: ['free', 'premium'],
//       default: 'free',
//     },
//     subscriptionExpiry: {
//       type: Date,
//       default: null,
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   { timestamps: true }
// );

// // Hash password before saving
// userSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) {
//     return next();
//   }

//   try {
//     const salt = await bcryptjs.genSalt(10);
//     this.password = await bcryptjs.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // Method to compare passwords
// userSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcryptjs.compare(enteredPassword, this.password);
// };

// module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Please provide a first name'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Please provide a last name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    matricNo: {
      type: String,
      required: [true, 'Please provide a matric number'],
      unique: true,
    },
    currentLevel: {
      type: String,
      enum: ['100', '200', '300', '400'],
      required: true,
    },
    role: {
      type: String,
      enum: ['student', 'moderator', 'instructor', 'admin'],
      default: 'student',
    },
    phone: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: null,
      maxlength: 500,
    },
    profilePhoto: {
      type: String,
      default: null,
    },
    courseEnrolled: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    subscriptionStatus: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free',
    },
    subscriptionExpiry: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);