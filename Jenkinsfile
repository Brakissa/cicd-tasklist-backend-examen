pipeline {
  agent any

  environment {
    DOCKER_HUB_REPOSITORY = 'your-dockerhub-username/tasklist-backend'
    IMAGE_TAG = "${env.BUILD_NUMBER ?: 'latest'}"
    SONAR_PROJECT_KEY = 'tasklist-backend'
  }

  stages {
    stage('Install dependencies') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Generate Prisma client') {
      steps {
        sh 'npm run prisma:generate'
      }
    }

    stage('Unit tests') {
      steps {
        sh 'npm test'
      }
      post {
        always {
          junit 'reports/junit.xml'
        }
      }
    }

    stage('End-to-end tests') {
      steps {
        sh 'npm run test:e2e'
      }
    }

    stage('SonarQube analysis') {
      steps {
        withSonarQubeEnv('SonarQube') {
          sh 'sonar-scanner -Dsonar.projectKey=${SONAR_PROJECT_KEY} -Dsonar.sources=src -Dsonar.tests=src/__tests__ -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info'
        }
      }
    }

    stage('SonarQube Quality Gate') {
      steps {
        timeout(time: 5, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }

    stage('Build Docker image') {
      steps {
        script {
          def imageName = "${DOCKER_HUB_REPOSITORY}:${IMAGE_TAG}"
          sh "docker build -t ${imageName} ."
          env.BUILT_IMAGE = imageName
        }
      }
    }

    stage('Security scan image with Trivy') {
      steps {
        script {
          sh 'mkdir -p security-reports'
          sh "trivy image --exit-code 1 --severity HIGH,CRITICAL --format json --output security-reports/trivy-report.json ${env.BUILT_IMAGE} || true"
          sh "trivy image --format spdx-json --output security-reports/sbom.json ${env.BUILT_IMAGE} || true"
        }
      }
    }

    stage('Publish Docker image') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
          sh 'echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin'
          sh "docker push ${env.BUILT_IMAGE}"
        }
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'security-reports/**', allowEmptyArchive: true
      cleanWs()
    }
  }
}
