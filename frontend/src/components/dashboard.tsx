// "use client";

// import { useState, useEffect } from "react";
// import { motion } from "framer-motion";
// import { FaTasks, FaClock, FaCheckCircle, FaSignOutAlt, FaArrowRight } from "react-icons/fa";
// import { poppins } from "@/fonts";
// import { useRouter } from "next/navigation";

// const containerVariants = {
//   hidden: { opacity: 0, y: 20 },
//   visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1, duration: 0.5 } }
// };

// const cardVariants = {
//   hidden: { opacity: 0, y: 20 },
//   visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
// };

// export default function Dashboard() {
//   const router = useRouter();
//   const [userName, setUserName] = useState("User");
//   const [currentDate, setCurrentDate] = useState("");
//   const [taskCompletion, setTaskCompletion] = useState(0);
//   const [timeSaved, setTimeSaved] = useState(0);
//   const [efficiency, setEfficiency] = useState(0);

// useEffect(() => {
//   const token = localStorage.getItem("auth_token");
//   if (!token) {
//     router.replace("/"); // redirect to login
//     return;
//   }

//   const fetchProfileAndTodos = async () => {
//     try {
//       // Fetch user profile
//       const profileRes = await fetch("http://localhost:3001/api/auth/me", {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!profileRes.ok) throw new Error("Failed to fetch profile");
//       const profileData = await profileRes.json();
//       setUserName(profileData.name);

//       // Fetch todos
//       const todosRes = await fetch("http://localhost:3001/api/todos", {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!todosRes.ok) throw new Error("Failed to fetch todos");
//       const todosData = await todosRes.json();

//       // Count completed tasks
//       const totalTasks = todosData.length;
// const completedTasks = todosData.filter((t: any) => t.status === "completed").length;
// const completionPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
// setTaskCompletion(completionPercent);

//       // ✅ Fetch counter for time saved
//       const counterRes = await fetch("http://localhost:3001/api/counter", {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (counterRes.ok) {
//         const counterData = await counterRes.json();
//         console.log("Counter fetched:", counterData); // Debug log
//         setTimeSaved(counterData.timeSaved || 0);
//       }

//     } catch (err) {
//       console.error("Error fetching data:", err);
//       localStorage.removeItem("auth_token");
//       router.replace("/");
//     }
//   };

//   fetchProfileAndTodos();

//   // Set date
//   const today = new Date();
//   setCurrentDate(
//     today.toLocaleDateString("en-US", {
//       weekday: "long",
//       month: "long",
//       day: "numeric",
//     })
//   );

//   // Set static efficiency for now
//   setEfficiency(85);
// }, [router]);





//   const goToTasks = () => router.push("/tasks");
//   const onLogout = () => {
//     localStorage.removeItem("auth_token");
//     router.replace("/");
//   };

//   return (
//     <motion.div
//       variants={containerVariants}
//       initial="hidden"
//       animate="visible"
//       className={`min-h-screen bg-gradient-to-br from-blue-100 via-sky-100 to-indigo-100 ${poppins.className} p-8 flex flex-col`}
//     >
//       {/* Header */}
//       <motion.header variants={cardVariants} className="flex items-center justify-between mb-8 flex-shrink-0">
//         <div>
//           <h1 className="text-4xl font-extrabold text-slate-900">
//             Context<span className="text-blue-600">Flow</span>
//           </h1>
//           <p className="text-slate-600 font-medium mt-1">
//             Welcome, {userName} — {currentDate}
//           </p>
//         </div>
//         <motion.button
//           whileHover={{ scale: 1.05 }}
//           whileTap={{ scale: 0.95 }}
//           onClick={onLogout}
//           className="px-4 py-2 border border-red-600 text-red-600 rounded-xl font-bold hover:bg-red-50 flex items-center gap-2"
//         >
//           <FaSignOutAlt /> Logout
//         </motion.button>
//       </motion.header>

//       {/* Main Panel */}
//       <div className="flex-1 flex gap-8 min-h-0">
//         {/* Task Panel */}
//         <motion.div
//           variants={cardVariants}
//           className="flex-1 bg-gradient-to-br from-blue-200 via-blue-100 to-blue-50 border border-blue-300 rounded-3xl backdrop-blur-md p-8 flex flex-col justify-center gap-6 min-h-0"
//         >
//           <h2 className="text-3xl font-bold text-slate-900">Manage Your Tasks</h2>
//           <p className="text-slate-700 text-lg max-w-lg">
//             Open your full task management panel to view, edit, or create tasks efficiently.
//           </p>
//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={goToTasks}
//             className="border border-blue-600 text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 flex items-center gap-3 mt-auto"
//           >
//             Go to Tasks <FaArrowRight />
//           </motion.button>
//         </motion.div>

//         {/* Stats Column */}
//         <motion.div className="flex flex-col justify-between lg:w-80 gap-6 min-h-0">
//           <motion.div
//             variants={cardVariants}
//             className="flex items-center gap-4 border border-blue-300 rounded-2xl p-6 backdrop-blur-md bg-blue-50/50 hover:shadow-lg transition flex-1 min-h-0"
//           >
//             <div className="w-12 h-12 border border-blue-400 rounded-lg flex items-center justify-center text-blue-600 text-xl">
//               <FaTasks />
//             </div>
//             <div>
//               <p className="text-blue-500 text-sm">Task Completion</p>
//               <p className="text-slate-900 font-bold text-xl">{taskCompletion}%</p>
//             </div>
//           </motion.div>

//           <motion.div
//             variants={cardVariants}
//             className="flex items-center gap-4 border border-blue-300 rounded-2xl p-6 backdrop-blur-md bg-sky-50/50 hover:shadow-lg transition flex-1 min-h-0"
//           >
//             <div className="w-12 h-12 border border-sky-400 rounded-lg flex items-center justify-center text-sky-600 text-xl">
//               <FaClock />
//             </div>
//             <div>
//               <p className="text-sky-500 text-sm">Time Saved</p>
//               <p className="text-slate-900 font-bold text-xl">{timeSaved} mins</p>
//             </div>
//           </motion.div>

//           <motion.div
//             variants={cardVariants}
//             className="flex items-center gap-4 border border-blue-300 rounded-2xl p-6 backdrop-blur-md bg-indigo-50/50 hover:shadow-lg transition flex-1 min-h-0"
//           >
//             <div className="w-12 h-12 border border-indigo-400 rounded-lg flex items-center justify-center text-indigo-600 text-xl">
//               <FaCheckCircle />
//             </div>
//             <div>
//               <p className="text-indigo-500 text-sm">AI-Assisted Efficiency</p>
//               <p className="text-slate-900 font-bold text-xl">{efficiency}%</p>
//             </div>
//           </motion.div>
//         </motion.div>
//       </div>
//     </motion.div>
//   );
// }



"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaTasks, FaClock, FaCheckCircle, FaSignOutAlt, FaArrowRight } from "react-icons/fa";
import { poppins } from "@/fonts";
import { useRouter } from "next/navigation";

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1, duration: 0.5 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function Dashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [currentDate, setCurrentDate] = useState("");
  const [taskCompletion, setTaskCompletion] = useState(0);
  const [timeSaved, setTimeSaved] = useState(60);
  const [efficiency, setEfficiency] = useState(0);

useEffect(() => {
  const token = localStorage.getItem("auth_token");
  if (!token) {
    router.replace("/"); // redirect to login
    return;
  }

  const fetchProfileAndTodos = async () => {
    try {
      // Fetch user profile
      const profileRes = await fetch("http://localhost:3001/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!profileRes.ok) throw new Error("Failed to fetch profile");
      const profileData = await profileRes.json();
      setUserName(profileData.name);

      // Fetch todos
      const todosRes = await fetch("http://localhost:3001/api/todos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!todosRes.ok) throw new Error("Failed to fetch todos");
      const todosData = await todosRes.json();

      // Count completed tasks
      const totalTasks = todosData.length;
const completedTasks = todosData.filter((t: any) => t.status === "completed").length;
const completionPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
setTaskCompletion(completionPercent);

      // ✅ Fetch counter for time saved
      const counterRes = await fetch("http://localhost:3001/api/counter", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (counterRes.ok) {
        const counterData = await counterRes.json();
        console.log("Counter fetched:", counterData); // Debug log
        setTimeSaved(counterData.timeSaved || 0);
      }

    } catch (err) {
      console.error("Error fetching data:", err);
      localStorage.removeItem("auth_token");
      router.replace("/");
    }
  };

  fetchProfileAndTodos();

  // Set date
  const today = new Date();
  setCurrentDate(
    today.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
  );

  // Set static efficiency for now
  setEfficiency(85);
}, [router]);





  const goToTasks = () => router.push("/tasks");
  const onLogout = () => {
    localStorage.removeItem("auth_token");
    router.replace("/");
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`min-h-screen bg-gradient-to-br from-blue-100 via-sky-100 to-indigo-100 ${poppins.className} p-8 flex flex-col`}
    >
      {/* Header */}
      <motion.header variants={cardVariants} className="flex items-center justify-between mb-8 flex-shrink-0">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900">
            Context<span className="text-blue-600">Flow</span>
          </h1>
          <p className="text-slate-600 font-medium mt-1">
            Welcome, {userName} — {currentDate}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLogout}
          className="px-4 py-2 border border-red-600 text-red-600 rounded-xl font-bold hover:bg-red-50 flex items-center gap-2"
        >
          <FaSignOutAlt /> Logout
        </motion.button>
      </motion.header>

      {/* Main Panel */}
      <div className="flex-1 flex gap-8 min-h-0">
        {/* Task Panel */}
        <motion.div
          variants={cardVariants}
          className="flex-1 bg-gradient-to-br from-blue-200 via-blue-100 to-blue-50 border border-blue-300 rounded-3xl backdrop-blur-md p-8 flex flex-col justify-center gap-6 min-h-0"
        >
          <h2 className="text-3xl font-bold text-slate-900">Manage Your Tasks</h2>
          <p className="text-slate-700 text-lg max-w-lg">
            Open your full task management panel to view, edit, or create tasks efficiently.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToTasks}
            className="border border-blue-600 text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 flex items-center gap-3 mt-auto"
          >
            Go to Tasks <FaArrowRight />
          </motion.button>
        </motion.div>

        {/* Stats Column */}
        <motion.div className="flex flex-col justify-between lg:w-80 gap-6 min-h-0">
          <motion.div
            variants={cardVariants}
            className="flex items-center gap-4 border border-blue-300 rounded-2xl p-6 backdrop-blur-md bg-blue-50/50 hover:shadow-lg transition flex-1 min-h-0"
          >
            <div className="w-12 h-12 border border-blue-400 rounded-lg flex items-center justify-center text-blue-600 text-xl">
              <FaTasks />
            </div>
            <div>
              <p className="text-blue-500 text-sm">Task Completion</p>
              <p className="text-slate-900 font-bold text-xl">{taskCompletion}%</p>
            </div>
          </motion.div>

          <motion.div
            variants={cardVariants}
            className="flex items-center gap-4 border border-blue-300 rounded-2xl p-6 backdrop-blur-md bg-sky-50/50 hover:shadow-lg transition flex-1 min-h-0"
          >
            <div className="w-12 h-12 border border-sky-400 rounded-lg flex items-center justify-center text-sky-600 text-xl">
              <FaClock />
            </div>
            <div>
              <p className="text-sky-500 text-sm">Time Saved</p>
              <p className="text-slate-900 font-bold text-xl">{timeSaved} mins</p>
            </div>
          </motion.div>

          <motion.div
            variants={cardVariants}
            className="flex items-center gap-4 border border-blue-300 rounded-2xl p-6 backdrop-blur-md bg-indigo-50/50 hover:shadow-lg transition flex-1 min-h-0"
          >
            <div className="w-12 h-12 border border-indigo-400 rounded-lg flex items-center justify-center text-indigo-600 text-xl">
              <FaCheckCircle />
            </div>
            <div>
              <p className="text-indigo-500 text-sm">AI-Assisted Efficiency</p>
              <p className="text-slate-900 font-bold text-xl">{efficiency}%</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
