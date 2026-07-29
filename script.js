<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Developer Gyan - Digital Store</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            user-select: none;
        }

        body {
            background-color: #05050a;
            color: #ffffff;
            background-image: linear-gradient(rgba(147, 51, 234, 0.08) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(56, 189, 248, 0.08) 1px, transparent 1px);
            background-size: 40px 40px;
            overflow-x: hidden;
        }

        header {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 25px;
            background: rgba(5, 5, 10, 0.95);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(168, 85, 247, 0.3);
            z-index: 1000;
        }

        .logo {
            font-size: 1.2rem;
            font-weight: 800;
            background: linear-gradient(135deg, #c084fc, #38bdf8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: 2px;
            text-transform: uppercase;
        }

        .menu-btn {
            font-size: 1.6rem;
            cursor: pointer;
            color: #38bdf8;
            background: none;
            border: none;
            transition: transform 0.1s ease;
        }

        .menu-btn:active {
            transform: scale(0.9);
        }

        .sidebar {
            position: fixed;
            top: 0;
            right: -280px;
            width: 280px;
            height: 100%;
            background: #0d0d1a;
            border-left: 1px solid rgba(168, 85, 247, 0.4);
            box-shadow: -10px 0 30px rgba(0,0,0,0.8);
            transition: right 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1100;
            padding: 60px 20px 20px 20px;
        }

        .sidebar.active {
            right: 0;
        }

        .sidebar h3 {
            color: #c084fc;
            margin-bottom: 20px;
            font-size: 1.2rem;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            padding-bottom: 10px;
        }

        .sidebar ul {
            list-style: none;
        }

        .sidebar ul li {
            margin: 15px 0;
        }

        .sidebar ul li a {
            color: #d1d5db;
            text-decoration: none;
            font-size: 1rem;
            transition: color 0.1s ease, padding-left 0.1s ease;
            display: block;
        }

        .sidebar ul li a:hover {
            color: #38bdf8;
            padding-left: 8px;
        }

        .close-sidebar {
            position: absolute;
            top: 20px;
            right: 20px;
            font-size: 1.5rem;
            cursor: pointer;
            color: #fff;
            background: none;
            border: none;
        }

        .container {
            padding-top: 90px;
            max-width: 1100px;
            margin: 0 auto;
            min-height: 90vh;
            padding-bottom: 50px;
        }

        .view {
            display: none !important;
        }

        .view.active {
            display: block !important;
            animation: fastFade 0.2s ease-in-out;
        }

        @keyframes fastFade {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }

        #welcome-view {
            min-height: calc(100vh - 140px);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
        }

        .main-heading {
            font-size: 2.6rem;
            font-weight: 800;
            margin-bottom: 20px;
            line-height: 1.2;
            background: linear-gradient(135deg, #ffffff, #c084fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .store-description {
            font-size: 1.05rem;
            color: #94a3b8;
            max-width: 650px;
            margin-bottom: 30px;
            line-height: 1.6;
        }

        .btn {
            background: linear-gradient(135deg, #9333ea, #38bdf8);
            color: white;
            border: none;
            padding: 14px 35px;
            font-size: 1.1rem;
            font-weight: bold;
            border-radius: 30px;
            cursor: pointer;
            box-shadow: 0 0 15px rgba(147, 51, 234, 0.4);
            transition: transform 0.1s ease, box-shadow 0.1s ease, filter 0.1s ease;
            text-decoration: none;
            display: inline-block;
        }

        .btn:hover {
            filter: brightness(1.15);
            box-shadow: 0 0 25px rgba(56, 189, 248, 0.6);
        }

        .btn:active {
            transform: scale(
