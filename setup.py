from setuptools import find_packages, setup

setup(
    name="ultrasafe",
    version="0.1.0",
    description="Ultrasafe nerve detection demo",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "fastapi==0.115.5",
        "uvicorn[standard]==0.32.1",
        "opencv-python==4.10.0.84",
        "numpy==2.1.3",
        "torch>=2.2.0",
        "pandas==2.2.3",
    ],
    entry_points={
        "console_scripts": [
            "ultrasafe-run=ultrasafe.__main__:main",
        ]
    },
)

