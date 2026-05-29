const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

dotenv.config();

const User = require("./models/User");
const Course = require("./models/Course");

const connectDB = require("./config/db");

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany();
    await Course.deleteMany();

    console.log("Cleared existing data");

    // Create admin user
    const admin = await User.create({
      name: "Admin User",
      email: "admin@techacademy.com",
      phone: "+2348012345678",
      password: "admin123",
      role: "admin",
      isEmailVerified: true,
    });

    // Create test student
    const student = await User.create({
      name: "John Student",
      email: "student@test.com",
      phone: "+2348011111111",
      password: "student123",
      role: "student",
      isEmailVerified: true,
    });

    console.log("Users created");

    // Create courses
    const courses = await Course.insertMany([
      {
        title: "Full Stack Web Development Bootcamp",
        shortDescription:
          "Master HTML, CSS, JavaScript, React, Node.js, and MongoDB in this intensive 12-week programme.",
        description:
          "This comprehensive bootcamp covers everything you need to become a professional full-stack web developer. Starting from the fundamentals of HTML and CSS, you will progress through JavaScript, React, Node.js, Express, and MongoDB.\n\nBy the end of this programme, you will have built multiple real-world projects for your portfolio and be ready for junior developer roles.",
        courseType: "offline",
        price: 350000,
        discountPrice: 280000,
        category: "Web Development",
        level: "Beginner",
        duration: "12 weeks",
        location: "Ikeja, Lagos",
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        schedule: "Mon - Fri, 10:00 AM - 3:00 PM",
        instructor: {
          name: "Adebayo Johnson",
          title: "Senior Full-Stack Developer",
          bio: "10+ years experience building web applications for startups and enterprise companies.",
        },
        curriculum: [
          { title: "Web Fundamentals", topics: ["HTML5", "CSS3", "Responsive Design", "Git & GitHub"] },
          { title: "JavaScript", topics: ["ES6+", "DOM Manipulation", "Async JS", "APIs"] },
          { title: "React", topics: ["Components", "Hooks", "State Management", "Routing"] },
          { title: "Backend", topics: ["Node.js", "Express", "REST APIs", "Authentication"] },
          { title: "Database", topics: ["MongoDB", "Mongoose", "Data Modelling"] },
          { title: "Capstone Project", topics: ["Full-Stack App", "Deployment", "Portfolio Review"] },
        ],
        whatYouWillLearn: [
          "Build responsive websites from scratch",
          "Create dynamic web applications with React",
          "Build RESTful APIs with Node.js and Express",
          "Work with MongoDB databases",
          "Deploy applications to the cloud",
          "Collaborate using Git and GitHub",
        ],
        requirements: [
          "A laptop with at least 8GB RAM",
          "Basic computer literacy",
          "No prior coding experience required",
        ],
        tags: ["web", "react", "node", "javascript", "fullstack"],
        isPublished: true,
        isFeatured: true,
        studentsEnrolled: 124,
      },
      {
        title: "Data Science & Analytics Programme",
        shortDescription:
          "Learn Python, statistics, data visualisation, and machine learning fundamentals.",
        description:
          "Dive into the world of data science with this hands-on programme. You will learn Python programming, statistical analysis, data visualisation with tools like Pandas and Matplotlib, and get an introduction to machine learning.\n\nPerfect for anyone looking to transition into a data-driven role.",
        courseType: "offline",
        price: 400000,
        discountPrice: 0,
        category: "Data Science",
        level: "Beginner",
        duration: "10 weeks",
        location: "Victoria Island, Lagos",
        startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        schedule: "Mon, Wed, Fri — 10:00 AM - 2:00 PM",
        instructor: {
          name: "Chioma Okafor",
          title: "Lead Data Scientist",
          bio: "Former data scientist at a Fortune 500 company with a passion for teaching.",
        },
        curriculum: [
          { title: "Python Basics", topics: ["Syntax", "Data Types", "Functions", "OOP"] },
          { title: "Data Analysis", topics: ["NumPy", "Pandas", "Data Cleaning"] },
          { title: "Visualisation", topics: ["Matplotlib", "Seaborn", "Plotly"] },
          { title: "Statistics", topics: ["Probability", "Hypothesis Testing", "Regression"] },
          { title: "Machine Learning", topics: ["Scikit-learn", "Classification", "Clustering"] },
        ],
        whatYouWillLearn: [
          "Program confidently in Python",
          "Analyse and clean large datasets",
          "Create compelling data visualisations",
          "Apply statistical methods to real data",
          "Build basic machine learning models",
        ],
        requirements: [
          "A laptop",
          "Basic maths knowledge",
          "No coding experience needed",
        ],
        tags: ["python", "data", "analytics", "ml"],
        isPublished: true,
        isFeatured: true,
        studentsEnrolled: 89,
      },
      {
        title: "UI/UX Design Masterclass",
        shortDescription:
          "Design beautiful, user-centred digital products using Figma and industry best practices.",
        description:
          "Learn the art and science of creating exceptional user experiences. This course covers design thinking, wireframing, prototyping, user research, and visual design using Figma.",
        courseType: "offline",
        price: 250000,
        discountPrice: 200000,
        category: "UI/UX Design",
        level: "Beginner",
        duration: "8 weeks",
        location: "Lekki, Lagos",
        startDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        schedule: "Sat & Sun — 10:00 AM - 3:00 PM",
        instructor: {
          name: "Fatima Ahmed",
          title: "Product Design Lead",
          bio: "Award-winning designer with experience at top tech companies.",
        },
        curriculum: [
          { title: "Design Thinking", topics: ["Empathy Mapping", "User Personas", "Problem Definition"] },
          { title: "UX Research", topics: ["User Interviews", "Surveys", "Usability Testing"] },
          { title: "Wireframing", topics: ["Low-fidelity Wireframes", "Information Architecture"] },
          { title: "Visual Design", topics: ["Typography", "Colour Theory", "Layout Grids"] },
          { title: "Prototyping in Figma", topics: ["Components", "Auto Layout", "Interactions"] },
        ],
        whatYouWillLearn: [
          "Conduct user research",
          "Create wireframes and prototypes in Figma",
          "Apply design thinking methodology",
          "Build a professional design portfolio",
        ],
        requirements: ["A laptop", "Figma account (free)"],
        tags: ["design", "figma", "ux", "ui"],
        isPublished: true,
        isFeatured: true,
        studentsEnrolled: 67,
      },
      {
        title: "Mobile App Development with Flutter",
        shortDescription:
          "Build cross-platform mobile apps for iOS and Android using Flutter and Dart.",
        description:
          "Learn to build beautiful, natively compiled mobile applications using Google's Flutter framework. From basics to deployment.",
        courseType: "offline",
        price: 300000,
        discountPrice: 0,
        category: "Mobile Development",
        level: "Intermediate",
        duration: "10 weeks",
        location: "Ikeja, Lagos",
        startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        schedule: "Mon - Fri, 10:00 AM - 2:00 PM",
        instructor: {
          name: "Emeka Nwosu",
          title: "Senior Mobile Developer",
          bio: "Published multiple apps with millions of downloads on Play Store and App Store.",
        },
        curriculum: [
          { title: "Dart Language", topics: ["Variables", "Functions", "Classes", "Async"] },
          { title: "Flutter Basics", topics: ["Widgets", "Layouts", "Navigation"] },
          { title: "State Management", topics: ["Provider", "Riverpod", "BLoC"] },
          { title: "APIs & Storage", topics: ["HTTP Requests", "Local DB", "Firebase"] },
          { title: "Deployment", topics: ["Google Play", "App Store", "CI/CD"] },
        ],
        whatYouWillLearn: [
          "Build cross-platform mobile apps",
          "Master Dart programming language",
          "Implement complex UI designs",
          "Integrate APIs and Firebase",
          "Publish apps to app stores",
        ],
        requirements: ["Laptop with 8GB+ RAM", "Basic programming knowledge"],
        tags: ["flutter", "dart", "mobile", "ios", "android"],
        isPublished: true,
        isFeatured: false,
        studentsEnrolled: 45,
      },
      {
        title: "Introduction to Cybersecurity",
        shortDescription:
          "Learn the fundamentals of cybersecurity, ethical hacking, and network security.",
        description:
          "A comprehensive introduction to cybersecurity concepts, tools, and best practices. Ideal for beginners looking to enter the cybersecurity field.",
        courseType: "online",
        price: 0,
        category: "Cybersecurity",
        level: "Beginner",
        duration: "Self-paced",
        onlinePlatformUrl: "https://elearning.techacademy.com/cybersecurity",
        instructor: {
          name: "Ibrahim Yusuf",
          title: "Cybersecurity Consultant",
          bio: "Certified ethical hacker with 8 years of experience in information security.",
        },
        whatYouWillLearn: [
          "Understand cyber threats and vulnerabilities",
          "Learn network security fundamentals",
          "Use basic security tools",
          "Implement security best practices",
        ],
        tags: ["security", "hacking", "network"],
        isPublished: true,
        isFeatured: true,
        studentsEnrolled: 210,
      },
      {
        title: "Cloud Computing with AWS",
        shortDescription:
          "Master Amazon Web Services — from EC2 to Lambda, S3 to RDS.",
        description:
          "Learn cloud computing with AWS. This online course covers the most important AWS services for developers and DevOps engineers.",
        courseType: "online",
        price: 0,
        category: "Cloud Computing",
        level: "Intermediate",
        duration: "Self-paced",
        onlinePlatformUrl: "https://elearning.techacademy.com/aws",
        instructor: {
          name: "Grace Eze",
          title: "AWS Solutions Architect",
          bio: "AWS certified solutions architect with hands-on cloud experience.",
        },
        whatYouWillLearn: [
          "Navigate the AWS Console",
          "Deploy applications on EC2",
          "Use S3 for storage",
          "Set up databases with RDS",
          "Build serverless apps with Lambda",
        ],
        tags: ["aws", "cloud", "devops"],
        isPublished: true,
        isFeatured: false,
        studentsEnrolled: 156,
      },
    ]);

    console.log(`${courses.length} courses created`);
    console.log("\n--- SEED DATA COMPLETE ---");
    console.log("Admin login: admin@techacademy.com / admin123");
    console.log("Student login: student@test.com / student123\n");

    process.exit(0);
  } catch (error) {
    console.error("Seeder error:", error);
    process.exit(1);
  }
};

seedData();